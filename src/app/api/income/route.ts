import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notifyWorkspaceAlert } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const incomes = await prisma.income.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { exchangeRate: true, baseCurrency: true },
    });

    const rate = workspace?.exchangeRate || 4100;

    let totalUsd = 0;
    let totalKhr = 0;
    for (const inc of incomes) {
      if (inc.currency === 'USD') {
        totalUsd += inc.total;
        totalKhr += inc.total * rate;
      } else {
        totalKhr += inc.total;
        totalUsd += inc.total / rate;
      }
    }

    return NextResponse.json({
      success: true,
      incomes,
      summary: {
        totalUsd,
        totalKhr,
        count: incomes.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      invoiceNo,
      clientName,
      clientTin,
      description,
      category,
      paymentMethod,
      currency,
      total,
      vat,
      status,
      reference,
    } = body;

    if (!clientName || !total) {
      return NextResponse.json({ success: false, error: 'Client name and total are required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const numTotal = parseFloat(total) || 0;
    const numVat = parseFloat(vat) || 0;
    const amountExclVat = Math.max(0, numTotal - numVat);
    const activeRate = workspace.exchangeRate || 4100;
    const isUsd = currency === 'USD';

    // Calculate base reporting currency equivalent
    let totalBaseEquiv = 0;
    if (workspace.baseCurrency === 'USD') {
      totalBaseEquiv = isUsd ? numTotal : numTotal / activeRate;
    } else {
      totalBaseEquiv = isUsd ? numTotal * activeRate : numTotal;
    }

    const submitterName = session ? `${session.name || 'Staff'} (${session.email})` : 'Web User';

    const newIncome = await prisma.income.create({
      data: {
        workspaceId: session.workspaceId,
        submittedBy: body.submittedBy || submitterName,
        date: date || new Date().toISOString().split('T')[0],
        invoiceNo: invoiceNo || null,
        clientName,
        clientTin: clientTin || null,
        description: description || null,
        category: category || 'Client Services',
        paymentMethod: paymentMethod || 'ABA Bank Transfer',
        currency: isUsd ? 'USD' : 'KHR',
        rate: activeRate,
        amountExclVat,
        vat: numVat,
        total: numTotal,
        totalBaseEquiv,
        status: status || 'RECEIVED',
        reference: reference || null,
      },
    });

    // Fire Telegram Alert in background
    notifyWorkspaceAlert(session.workspaceId, 'NEW_INCOME', {
      clientName,
      total: numTotal,
      currency: isUsd ? 'USD' : 'KHR',
      totalFormatted: isUsd ? `$${numTotal.toFixed(2)}` : `${numTotal.toLocaleString()} ៛`,
      category: category || 'Client Services',
      paymentMethod: paymentMethod || 'ABA Bank Transfer',
      invoiceNo: invoiceNo || '—',
    }).catch((err) => console.error('Telegram income alert failed:', err));

    return NextResponse.json({
      success: true,
      income: newIncome,
    });
  } catch (error: any) {
    console.error('Error creating income:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Income ID is required' }, { status: 400 });
    }

    await prisma.income.deleteMany({
      where: {
        id,
        workspaceId: session.workspaceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting income:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    const updated = await prisma.income.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, income: updated });
  } catch (error: any) {
    console.error('Error updating income:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
