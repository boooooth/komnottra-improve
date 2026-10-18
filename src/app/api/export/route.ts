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

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
    });

    const rate = workspace?.exchangeRate || 4100;
    const isBaseUsd = workspace?.baseCurrency === 'USD';

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const statusFilter = statusParam && statusParam !== 'ALL'
      ? { status: statusParam }
      : { status: { in: ['APPROVED', 'REIMBURSED'] } };

    // 1. Fetch Receipts (Expenses)
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

    // 2. Fetch Incomes
    const incomeStatusFilter = statusParam && statusParam !== 'ALL'
      ? { status: statusParam }
      : { status: 'APPROVED' };

    const incomes = await prisma.income.findMany({
      where: {
        workspaceId: session.workspaceId,
        ...incomeStatusFilter,
      },
      orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Komnottra · កំណត់ត្រា';
    workbook.created = new Date();

    // ----------------------------------------------------
    // WORKSHEET 1: COMBINED CASHFLOW LEDGER (INFLOW & OUTFLOW)
    // ----------------------------------------------------
    const cashflowSheet = workbook.addWorksheet('Cashflow Ledger', {
      views: [{ showGridLines: true }],
    });

    cashflowSheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Ref / Doc #', key: 'refNo', width: 16 },
      { header: 'Counterparty (Client / Vendor)', key: 'party', width: 28 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description / Note', key: 'description', width: 30 },
      { header: 'Submitter', key: 'submitter', width: 18 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Inflow (+)', key: 'inflow', width: 16 },
      { header: 'Outflow (-)', key: 'outflow', width: 16 },
      { header: isBaseUsd ? 'Net (USD Equiv)' : 'Net (KHR Equiv)', key: 'netBase', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    // Style Header
    const cfHeader = cashflowSheet.getRow(1);
    cfHeader.height = 28;
    cfHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate Navy
      };
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      };
    });
    [10, 11, 12].forEach((colIdx) => {
      cfHeader.getCell(colIdx).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    // Combine transactions chronologically
    type CombinedItem = {
      date: string;
      type: 'INCOME' | 'EXPENSE';
      refNo: string;
      party: string;
      category: string;
      description: string;
      submitter: string;
      currency: string;
      inflow: number;
      outflow: number;
      netBase: number;
      status: string;
    };

    const combinedList: CombinedItem[] = [];

    incomes.forEach((inc: any) => {
      const baseEquiv = isBaseUsd
        ? (inc.currency === 'USD' ? inc.total : inc.total / rate)
        : (inc.currency === 'KHR' ? inc.total : inc.total * rate);
      combinedList.push({
        date: inc.date || inc.createdAt.toISOString().substring(0, 10),
        type: 'INCOME',
        refNo: inc.invoiceNo || '—',
        party: inc.clientName,
        category: inc.category || 'Client Services',
        description: inc.reference || 'Client payment',
        submitter: inc.submittedBy || 'Finance',
        currency: inc.currency,
        inflow: inc.total,
        outflow: 0,
        netBase: baseEquiv,
        status: inc.status,
      });
    });

    receipts.forEach((r: any) => {
      const baseEquiv = isBaseUsd
        ? (r.currency === 'USD' ? r.total : r.total / rate)
        : (r.currency === 'KHR' ? r.total : r.total * rate);
      combinedList.push({
        date: r.date,
        type: 'EXPENSE',
        refNo: r.receiptNo || '—',
        party: r.payee,
        category: r.expenseCode || 'General',
        description: r.description || 'Expense claim',
        submitter: r.submittedBy || r.claimant?.name || 'Staff',
        currency: r.currency,
        inflow: 0,
        outflow: r.total,
        netBase: -baseEquiv,
        status: r.status,
      });
    });

    combinedList.sort((a, b) => a.date.localeCompare(b.date));

    let cfRowIdx = 2;
    combinedList.forEach((item, idx) => {
      const row = cashflowSheet.addRow({
        no: idx + 1,
        date: item.date,
        type: item.type === 'INCOME' ? 'INCOME (INFLOW)' : 'EXPENSE (OUTFLOW)',
        refNo: item.refNo,
        party: item.party,
        category: item.category,
        description: item.description,
        submitter: item.submitter,
        currency: item.currency,
        inflow: item.inflow > 0 ? item.inflow : null,
        outflow: item.outflow > 0 ? item.outflow : null,
        netBase: item.netBase,
        status: item.status,
      });

      row.height = 22;
      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        // Color coding
        if (colNumber === 3) {
          cell.font = { bold: true, color: { argb: item.type === 'INCOME' ? 'FF16A34A' : 'FFDC2626' } };
        } else if (colNumber === 10 && item.inflow > 0) {
          cell.numFmt = item.currency === 'USD' ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FF16A34A' } };
        } else if (colNumber === 11 && item.outflow > 0) {
          cell.numFmt = item.currency === 'USD' ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FFDC2626' } };
        } else if (colNumber === 12) {
          cell.numFmt = isBaseUsd ? '$#,##0.00;($#,##0.00);"-"' : '#,##0;(#,##0);"-"';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: item.netBase >= 0 ? 'FF16A34A' : 'FFDC2626' } };
        } else if (colNumber === 13) {
          cell.font = { bold: true, color: { argb: item.status === 'APPROVED' ? 'FF16A34A' : 'FFD97706' } };
        }
      });
      cfRowIdx++;
    });

    // Summary row for cashflow
    if (combinedList.length > 0) {
      const lastDataRow = cfRowIdx - 1;
      const sumRow = cashflowSheet.addRow({});
      sumRow.height = 26;
      cashflowSheet.mergeCells(`A${cfRowIdx}:I${cfRowIdx}`);
      const lbl = cashflowSheet.getCell(`A${cfRowIdx}`);
      lbl.value = `Total Net Cashflow (${isBaseUsd ? 'USD' : 'KHR'})`;
      lbl.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      lbl.alignment = { vertical: 'middle', indent: 1 };

      const netSumCell = cashflowSheet.getCell(`L${cfRowIdx}`);
      netSumCell.value = { formula: `SUM(L2:L${lastDataRow})` };
      netSumCell.numFmt = isBaseUsd ? '$#,##0.00;($#,##0.00);"-"' : '#,##0;(#,##0);"-"';
      netSumCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      netSumCell.alignment = { vertical: 'middle', horizontal: 'right' };
      netSumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

      ['J', 'K', 'M'].forEach((col) => {
        cashflowSheet.getCell(`${col}${cfRowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      });
    }

    // ----------------------------------------------------
    // WORKSHEET 2: DETAILED EXPENSE OUTFLOWS
    // ----------------------------------------------------
    const expenseSheet = workbook.addWorksheet('Expense Outflow', {
      views: [{ showGridLines: true }],
    });

    expenseSheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Receipt no.', key: 'receiptNo', width: 16 },
      { header: 'Payee', key: 'payee', width: 26 },
      { header: 'Vendor TIN', key: 'vendorTin', width: 18 },
      { header: 'Description', key: 'description', width: 26 },
      { header: 'Claimant', key: 'claimant', width: 18 },
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Expense code', key: 'expenseCode', width: 16 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Total', key: 'total', width: 16 },
      { header: isBaseUsd ? 'USD Equiv' : 'KHR Equiv', key: 'equiv', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    const expHeader = expenseSheet.getRow(1);
    expHeader.height = 26;
    expHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7A222B' } }; // Burgundy
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle' };
    });

    receipts.forEach((r: any, idx: number) => {
      const equiv = isBaseUsd
        ? (r.currency === 'USD' ? r.total : r.total / rate)
        : (r.currency === 'KHR' ? r.total : r.total * rate);

      const row = expenseSheet.addRow({
        no: idx + 1,
        date: r.date,
        receiptNo: r.receiptNo || '—',
        payee: r.payee,
        vendorTin: r.vendorTin || '—',
        description: r.description || '—',
        claimant: r.submittedBy || r.claimant?.name || '—',
        department: r.department || '—',
        expenseCode: r.expenseCode || '—',
        currency: r.currency,
        total: r.total,
        equiv,
        status: r.status,
      });

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        if (colNum === 11 || colNum === 12) {
          cell.numFmt = (colNum === 11 && r.currency === 'USD') || (colNum === 12 && isBaseUsd) ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });
    });

    // ----------------------------------------------------
    // WORKSHEET 3: CLIENT INFLOWS & REVENUE
    // ----------------------------------------------------
    const incomeSheet = workbook.addWorksheet('Income Inflow', {
      views: [{ showGridLines: true }],
    });

    incomeSheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Invoice #', key: 'invoiceNo', width: 16 },
      { header: 'Client / Payer', key: 'clientName', width: 28 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Reference', key: 'reference', width: 24 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Total Inflow', key: 'total', width: 18 },
      { header: isBaseUsd ? 'USD Equiv' : 'KHR Equiv', key: 'equiv', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    const incHeader = incomeSheet.getRow(1);
    incHeader.height = 26;
    incHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } }; // Forest Green
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle' };
    });

    incomes.forEach((inc: any, idx: number) => {
      const equiv = isBaseUsd
        ? (inc.currency === 'USD' ? inc.total : inc.total / rate)
        : (inc.currency === 'KHR' ? inc.total : inc.total * rate);

      const row = incomeSheet.addRow({
        no: idx + 1,
        date: inc.date || inc.createdAt.toISOString().substring(0, 10),
        invoiceNo: inc.invoiceNo || '—',
        clientName: inc.clientName,
        category: inc.category || 'General',
        paymentMethod: inc.paymentMethod || '—',
        reference: inc.reference || '—',
        currency: inc.currency,
        total: inc.total,
        equiv,
        status: inc.status,
      });

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        if (colNum === 9 || colNum === 10) {
          cell.numFmt = (colNum === 9 && inc.currency === 'USD') || (colNum === 10 && isBaseUsd) ? '$#,##0.00' : '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { bold: true, color: { argb: 'FF16A34A' } };
        }
      });
    });

    // 5. Generate Buffer and Return as Downloadable Stream
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `${(workspace?.name || 'Company').replace(/\s+/g, '_')}_Financial_Ledger_2026.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
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
