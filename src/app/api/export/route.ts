import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or no active workspace' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const statusFilter = statusParam && statusParam !== 'ALL'
      ? { status: statusParam }
      : { status: { in: ['APPROVED', 'REIMBURSED'] } };

    const receipts = await prisma.receipt.findMany({
      where: {
        workspaceId: session.workspaceId,
        ...statusFilter,
      },
      orderBy: { date: 'asc' },
      include: {
        claimant: true,
        approvedBy: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Komnottra · កំណត់ត្រា';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Expense Ledger', {
      views: [{ showGridLines: true }],
    });

    // 1. Define Columns matching the user's spreadsheet
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Receipt no.', key: 'receiptNo', width: 16 },
      { header: 'Payee', key: 'payee', width: 26 },
      { header: 'Vendor TIN', key: 'vendorTin', width: 18 },
      { header: 'Description', key: 'description', width: 26 },
      { header: 'Claimant', key: 'claimant', width: 18 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Project / budget line', key: 'project', width: 24 },
      { header: 'Expense code', key: 'expenseCode', width: 16 },
      { header: 'Payment method', key: 'paymentMethod', width: 16 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Rate', key: 'rate', width: 10 },
      { header: 'Amount excl. VAT', key: 'amountExclVat', width: 18 },
      { header: 'VAT', key: 'vat', width: 14 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Total (KHR equiv.)', key: 'totalBaseEquiv', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Approved by', key: 'approvedBy', width: 18 },
    ];

    // 2. Style the Burgundy Header Row (Matching user's screenshot & mockup)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7A222B' }, // Deep Wine Burgundy
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF5A1820' } },
        left: { style: 'thin', color: { argb: 'FF5A1820' } },
        bottom: { style: 'medium', color: { argb: 'FF5A1820' } },
        right: { style: 'thin', color: { argb: 'FF5A1820' } },
      };
    });

    // Right-align numeric headers
    [13, 14, 15, 16, 17].forEach((colIdx) => {
      headerRow.getCell(colIdx).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    // 3. Add Data Rows
    let currentRowNum = 2;
    receipts.forEach((r, idx) => {
      const row = worksheet.addRow({
        no: idx + 1,
        date: r.date,
        receiptNo: r.receiptNo || '—',
        payee: r.payee,
        vendorTin: r.vendorTin || '—',
        description: r.description || '—',
        claimant: r.claimant?.name || '—',
        department: r.department || '—',
        project: r.project || '—',
        expenseCode: r.expenseCode || '—',
        paymentMethod: r.paymentMethod || '—',
        currency: r.currency,
        rate: r.rate,
        amountExclVat: r.amountExclVat,
        vat: r.vat,
        total: r.total,
        totalBaseEquiv: r.totalBaseEquiv,
        status: r.status,
        approvedBy: r.approvedBy?.name || (r.status === 'APPROVED' ? (session.name || 'Workspace Approver') : '—'),
      });

      row.height = 22;

      // Zebra striping & cell formatting
      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFEFE8DE' } },
          right: { style: 'thin', color: { argb: 'FFF5EFE6' } },
        };

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDFBF8' },
          };
        }

        // Numeric column formats
        if (colNumber === 13) {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colNumber === 14 || colNumber === 15) {
          cell.numFmt = r.currency === 'USD' ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colNumber === 16) {
          cell.numFmt = r.currency === 'USD' ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FF1A73E8' } };
        } else if (colNumber === 17) {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FF137333' } };
        } else if (colNumber === 18) {
          // Status color
          if (r.status === 'APPROVED') {
            cell.font = { bold: true, color: { argb: 'FF137333' } };
          } else if (r.status === 'REIMBURSED') {
            cell.font = { bold: true, color: { argb: 'FF1A73E8' } };
          } else {
            cell.font = { bold: true, color: { argb: 'FFD97706' } };
          }
        }
      });

      currentRowNum++;
    });

    // 4. Add Summary Footer Row with Real Excel SUM Formula
    const lastDataRow = currentRowNum - 1;
    const summaryRow = worksheet.addRow({});
    summaryRow.height = 26;

    // Merge columns 1 to 16 for "Total (KHR equivalent)" label
    worksheet.mergeCells(`A${currentRowNum}:P${currentRowNum}`);
    const summaryLabel = worksheet.getCell(`A${currentRowNum}`);
    summaryLabel.value = 'Total (KHR equivalent)';
    summaryLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F1916' } };
    summaryLabel.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    summaryLabel.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EFE6' },
    };

    // Total KHR Equivalent SUM formula cell (Column Q is 17)
    const sumCell = worksheet.getCell(`Q${currentRowNum}`);
    sumCell.value = { formula: `SUM(Q2:Q${lastDataRow})` };
    sumCell.numFmt = '#,##0 "KHR"';
    sumCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF137333' } };
    sumCell.alignment = { vertical: 'middle', horizontal: 'right' };
    sumCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EFE6' },
    };

    // Remaining empty cells styled with background
    ['R', 'S'].forEach((colLetter) => {
      const c = worksheet.getCell(`${colLetter}${currentRowNum}`);
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5EFE6' },
      };
    });

    // 5. Generate Buffer and Return as Downloadable Stream
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Komnottra_Expense_Ledger_2026.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export Excel file' },
      { status: 500 }
    );
  }
}
