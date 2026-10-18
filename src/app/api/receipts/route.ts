import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NBC_EXCHANGE_RATE, calculateReceiptAmounts } from '@/lib/currency';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// GET: Fetch all receipts with filters & live summary stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const currency = searchParams.get('currency') || '';

    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({
        success: true,
        receipts: [],
        stats: {
          totalSpendKhr: 0,
          totalSpendUsd: 0,
          totalVatKhr: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalCount: 0,
          categories: { Transport: 0, 'Office supplies': 0, Meals: 0, Utilities: 0, Other: 0 },
        },
      });
    }

    // Build Prisma query filter - strictly scoped to user's workspace
    const where: any = {
      workspaceId: session.workspaceId,
    };

    if (department && department !== 'ALL') {
      where.department = department;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (currency && currency !== 'ALL') {
      where.currency = currency;
    }

    if (search) {
      where.OR = [
        { payee: { contains: search } },
        { receiptNo: { contains: search } },
        { description: { contains: search } },
        { vendorTin: { contains: search } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Compute live summary stats
    let totalSpendKhr = 0;
    let totalSpendUsd = 0;
    let totalVatKhr = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    const categoryMap: Record<string, number> = {
      Transport: 0,
      'Office supplies': 0,
      Meals: 0,
      Utilities: 0,
      Other: 0,
    };

    for (const r of receipts) {
      if (r.currency === 'USD') {
        totalSpendUsd += r.total;
        totalSpendKhr += r.totalBaseEquiv;
      } else {
        totalSpendKhr += r.total;
        totalVatKhr += r.vat;
      }

      if (r.status === 'PENDING') pendingCount++;
      if (r.status === 'APPROVED' || r.status === 'REIMBURSED') approvedCount++;
      if (r.status === 'REJECTED') rejectedCount++;

      // Category breakdown
      const code = (r.expenseCode || '').toLowerCase();
      if (code.includes('transport') || code.includes('6300')) {
        categoryMap.Transport += r.totalBaseEquiv;
      } else if (code.includes('office') || code.includes('6100')) {
        categoryMap['Office supplies'] += r.totalBaseEquiv;
      } else if (code.includes('meal') || code.includes('6200')) {
        categoryMap.Meals += r.totalBaseEquiv;
      } else if (code.includes('util') || code.includes('6400')) {
        categoryMap.Utilities += r.totalBaseEquiv;
      } else {
        categoryMap.Other += r.totalBaseEquiv;
      }
    }

    return NextResponse.json({
      success: true,
      receipts,
      stats: {
        totalSpendKhr,
        totalSpendUsd,
        totalVatKhr,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount: receipts.length,
        categories: categoryMap,
      },
    });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

// POST: Add a new receipt (from camera, upload, or review submission)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const session = await getCurrentUser();

    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Please create or join a workspace before submitting receipts.' }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: session.workspaceId } });
    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    let claimantId: string | undefined = session.userId;
    if (!claimantId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
      claimantId = defaultUser?.id;
    }
    if (!claimantId) {
      const fallbackUser = await prisma.user.findFirst();
      claimantId = fallbackUser?.id;
    }
    if (!claimantId) {
      return NextResponse.json({ success: false, error: 'User account required to submit claim' }, { status: 400 });
    }

    // 1. Batch Submission Support ({ receipts: [...] })
    if (Array.isArray(body.receipts) && body.receipts.length > 0) {
      const createdList = [];
      for (const item of body.receipts) {
        const itemCurrency = item.currency === 'USD' ? 'USD' : 'KHR';
        const itemTotal = parseFloat(item.total) || 0;
        const itemVatNum = item.vat !== undefined ? parseFloat(item.vat) || 0 : 0;
        const itemHasVat = itemVatNum > 0;
        const itemMath = calculateReceiptAmounts(itemTotal, itemCurrency, itemHasVat, workspace.exchangeRate);
        const itemStatus = session?.role === 'OWNER' ? 'APPROVED' : (item.status || 'PENDING');

        let itemImageUrl = item.imageUrl || '';
        if (itemImageUrl.startsWith('data:image/')) {
          try {
            const matches = itemImageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (matches) {
              const rawExt = matches[1].toLowerCase();
              const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
              const buffer = Buffer.from(matches[2], 'base64');
              const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
              const uploadDir = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              fs.writeFileSync(path.join(uploadDir, fileName), buffer);
              itemImageUrl = `/uploads/${fileName}`;
            }
          } catch (err) {
            console.error('Failed to write base64 image:', err);
          }
        }

        const r = await prisma.receipt.create({
          data: {
            workspaceId: workspace.id,
            claimantId: claimantId!,
            date: item.date || new Date().toLocaleDateString('en-GB'),
            payee: item.payee?.trim() || 'Unknown Vendor',
            vendorTin: item.vendorTin || '—',
            description: item.description || item.note || 'Expense claim',
            department: item.department || session?.department || 'General',
            project: item.project || 'General Expenses',
            expenseCode: item.expenseCode || 'General',
            paymentMethod: item.paymentMethod || 'Cash',
            currency: itemMath.currency,
            rate: itemMath.rate,
            amountExclVat: item.amountExclVat ? parseFloat(item.amountExclVat) : itemMath.amountExclVat,
            vat: item.vat ? parseFloat(item.vat) : itemMath.vat,
            total: itemMath.total,
            totalBaseEquiv: itemMath.totalBaseKhr,
            status: item.status || itemStatus,
            imageUrl: itemImageUrl,
            rawExtractedJson: item.rawExtractedJson
              ? (typeof item.rawExtractedJson === 'string' ? item.rawExtractedJson : JSON.stringify(item.rawExtractedJson))
              : null,
          },
        });
        createdList.push(r);
      }
      return NextResponse.json({ success: true, count: createdList.length, receipts: createdList });
    }

    const currency = body.currency === 'USD' ? 'USD' : 'KHR';
    const totalAmount = parseFloat(body.total) || 0;
    const vatNum = body.vat !== undefined ? parseFloat(body.vat) || 0 : 0;
    const hasVat = vatNum > 0;

    // Use our currency calculation engine
    const math = calculateReceiptAmounts(totalAmount, currency, hasVat, workspace.exchangeRate);

    const defaultStatus = session?.role === 'OWNER' ? 'APPROVED' : (body.status || 'PENDING');

    let finalImageUrl = body.imageUrl || '';
    if (finalImageUrl.startsWith('data:image/')) {
      try {
        const matches = finalImageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadDir, fileName), buffer);
          finalImageUrl = `/uploads/${fileName}`;
        }
      } catch (err) {
        console.error('Failed to write base64 image to disk, falling back to data URL:', err);
      }
    }

    const newReceipt = await prisma.receipt.create({
      data: {
        workspaceId: workspace.id,
        claimantId: claimantId!,
        date: body.date || new Date().toLocaleDateString('en-GB'), // e.g. 30/09/2026
        payee: body.payee?.trim() || 'Unknown Vendor',
        vendorTin: body.vendorTin || '—',
        description: body.description || body.note || 'Expense claim',
        department: body.department || session?.department || 'General',
        project: body.project || 'General Expenses',
        expenseCode: body.expenseCode || 'General',
        paymentMethod: body.paymentMethod || 'Cash',
        currency: math.currency,
        rate: math.rate,
        amountExclVat: body.amountExclVat ? parseFloat(body.amountExclVat) : math.amountExclVat,
        vat: body.vat ? parseFloat(body.vat) : math.vat,
        total: math.total,
        totalBaseEquiv: math.totalBaseKhr,
        status: body.status || defaultStatus,
        imageUrl: finalImageUrl,
        rawExtractedJson: body.rawExtractedJson ? JSON.stringify(body.rawExtractedJson) : null,
      },
    });

    return NextResponse.json({
      success: true,
      receipt: newReceipt,
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create receipt' },
      { status: 500 }
    );
  }
}

// PATCH: Approve, Reject, or Edit receipt
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids, status, rejectionReason, ...updateFields } = body;

    const session = await getCurrentUser();
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
    });

    // Support batch approve / update for multiple receipts
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const dataToUpdate: any = {};
      if (status) {
        dataToUpdate.status = status;
        if (status === 'APPROVED' || status === 'REIMBURSED') {
          dataToUpdate.approvedById = session?.userId || owner?.id || null;
        }
      }
      if (rejectionReason !== undefined) {
        dataToUpdate.rejectionReason = rejectionReason;
      }

      await prisma.receipt.updateMany({
        where: { id: { in: ids } },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${ids.length} receipts`,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Receipt ID or IDs array is required' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (updateFields.payee !== undefined) dataToUpdate.payee = updateFields.payee;
    if (updateFields.receiptNo !== undefined) dataToUpdate.receiptNo = updateFields.receiptNo;
    if (updateFields.date !== undefined) dataToUpdate.date = updateFields.date;
    if (updateFields.vendorTin !== undefined) dataToUpdate.vendorTin = updateFields.vendorTin;
    if (updateFields.description !== undefined) dataToUpdate.description = updateFields.description;
    if (updateFields.department !== undefined) dataToUpdate.department = updateFields.department;
    if (updateFields.project !== undefined) dataToUpdate.project = updateFields.project;
    if (updateFields.expenseCode !== undefined) dataToUpdate.expenseCode = updateFields.expenseCode;
    if (updateFields.paymentMethod !== undefined) dataToUpdate.paymentMethod = updateFields.paymentMethod;
    if (updateFields.imageUrl !== undefined) dataToUpdate.imageUrl = updateFields.imageUrl;

    if (updateFields.total !== undefined || updateFields.currency !== undefined) {
      const existing = await prisma.receipt.findUnique({ where: { id }, include: { workspace: true } });
      if (existing) {
        const totalNum = updateFields.total !== undefined ? parseFloat(updateFields.total) || 0 : existing.total;
        const curr = updateFields.currency !== undefined ? updateFields.currency : existing.currency;
        const rate = existing.workspace?.exchangeRate || 4100;
        const isBaseUsd = existing.workspace?.baseCurrency === 'USD';
        dataToUpdate.total = totalNum;
        dataToUpdate.currency = curr;
        dataToUpdate.rate = rate;
        dataToUpdate.totalBaseEquiv = isBaseUsd
          ? (curr === 'USD' ? totalNum : Math.round((totalNum / rate) * 100) / 100)
          : (curr === 'KHR' ? totalNum : Math.round(totalNum * rate));
        if (updateFields.vat !== undefined) {
          const v = parseFloat(updateFields.vat) || 0;
          dataToUpdate.vat = v;
          dataToUpdate.amountExclVat = Math.max(0, totalNum - v);
        } else {
          dataToUpdate.amountExclVat = totalNum;
          dataToUpdate.vat = 0;
        }
      }
    } else if (updateFields.vat !== undefined) {
      dataToUpdate.vat = parseFloat(updateFields.vat) || 0;
    }

    if (status) {
      dataToUpdate.status = status;
      if (status === 'APPROVED' || status === 'REIMBURSED') {
        dataToUpdate.approvedById = owner?.id || null;
      }
    }

    if (rejectionReason !== undefined) {
      dataToUpdate.rejectionReason = rejectionReason;
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      receipt: updated,
    });
  } catch (error: any) {
    console.error('Error updating receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update receipt' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Receipt ID required' }, { status: 400 });
    }
    await prisma.receipt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete receipt' }, { status: 500 });
  }
}
