import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      include: {
        receipts: {
          orderBy: { createdAt: 'desc' },
        },
        incomes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const rate = workspace.exchangeRate || 4100;

    // 1. Calculate Expenses & Category / Dept Distributions
    let totalExpenseUsd = 0;
    let totalExpenseKhr = 0;
    let receiptsWithTinCount = 0;
    const expenseByCat: Record<string, { usd: number; khr: number; count: number }> = {};
    const expenseByDept: Record<string, { usd: number; count: number }> = {};
    const monthlyTimeline: Record<string, { incomeUsd: number; expenseUsd: number; netUsd: number }> = {};

    // Track potential duplicates (anomalies)
    const seenReceipts = new Set<string>();
    const anomalies: Array<{ id: string; type: string; title: string; description: string; date: string }> = [];

    for (const r of workspace.receipts) {
      const usd = r.currency === 'USD' ? r.total : r.total / rate;
      const khr = r.currency === 'KHR' ? r.total : r.total * rate;
      totalExpenseUsd += usd;
      totalExpenseKhr += khr;

      if (r.vendorTin && r.vendorTin !== '—' && r.vendorTin.trim().length > 3) {
        receiptsWithTinCount++;
      }

      // Check duplicates
      const dupeKey = `${r.payee?.toLowerCase().trim()}_${r.date}_${r.total}`;
      if (seenReceipts.has(dupeKey)) {
        anomalies.push({
          id: r.id,
          type: 'DUPLICATE',
          title: `Potential Duplicate: ${r.payee}`,
          description: `Identical amount (${r.total} ${r.currency}) on ${r.date}`,
          date: r.date,
        });
      } else {
        seenReceipts.add(dupeKey);
      }

      // High spend anomaly
      if (usd >= (workspace.notifyHighSpendMin || 100)) {
        anomalies.push({
          id: r.id,
          type: 'HIGH_VALUE',
          title: `High Claim: ${r.payee} ($${usd.toFixed(2)})`,
          description: `Filed under ${r.department || 'General'} on ${r.date}`,
          date: r.date,
        });
      }

      const cat = r.expenseCode || 'General';
      if (!expenseByCat[cat]) expenseByCat[cat] = { usd: 0, khr: 0, count: 0 };
      expenseByCat[cat].usd += usd;
      expenseByCat[cat].khr += khr;
      expenseByCat[cat].count++;

      const dept = r.department || 'General';
      if (!expenseByDept[dept]) expenseByDept[dept] = { usd: 0, count: 0 };
      expenseByDept[dept].usd += usd;
      expenseByDept[dept].count++;

      // Monthly aggregation
      const monthKey = r.date ? r.date.substring(3) : new Date(r.createdAt).toISOString().substring(0, 7);
      if (!monthlyTimeline[monthKey]) monthlyTimeline[monthKey] = { incomeUsd: 0, expenseUsd: 0, netUsd: 0 };
      monthlyTimeline[monthKey].expenseUsd += usd;
    }

    // 2. Calculate Incomes
    let totalIncomeUsd = 0;
    let totalIncomeKhr = 0;
    const incomeByCat: Record<string, { usd: number; count: number }> = {};

    for (const inc of workspace.incomes) {
      const usd = inc.currency === 'USD' ? inc.total : inc.total / rate;
      const khr = inc.currency === 'KHR' ? inc.total : inc.total * rate;
      totalIncomeUsd += usd;
      totalIncomeKhr += khr;

      const cat = inc.category || 'Client Services';
      if (!incomeByCat[cat]) incomeByCat[cat] = { usd: 0, count: 0 };
      incomeByCat[cat].usd += usd;
      incomeByCat[cat].count++;

      const monthKey = inc.date ? inc.date.substring(0, 7) : new Date(inc.createdAt).toISOString().substring(0, 7);
      if (!monthlyTimeline[monthKey]) monthlyTimeline[monthKey] = { incomeUsd: 0, expenseUsd: 0, netUsd: 0 };
      monthlyTimeline[monthKey].incomeUsd += usd;
    }

    // Compute net for monthly timeline
    for (const m of Object.keys(monthlyTimeline)) {
      monthlyTimeline[m].netUsd = monthlyTimeline[m].incomeUsd - monthlyTimeline[m].expenseUsd;
    }

    const netCashflowUsd = totalIncomeUsd - totalExpenseUsd;
    const netCashflowKhr = totalIncomeKhr - totalExpenseKhr;

    // 3. AI Predictive Analytics & Runway Forecasting
    const receiptCount = workspace.receipts.length;
    const avgMonthlyBurnUsd = receiptCount > 0 ? Math.max(50, totalExpenseUsd / Math.max(1, receiptCount / 8)) : 0;
    const availableTreasuryUsd = Math.max(0, netCashflowUsd);
    const runwayMonths = avgMonthlyBurnUsd > 0 ? (availableTreasuryUsd / avgMonthlyBurnUsd) : 0;

    // Next 30 days forecasted expense (weighted average with 10% safety margin)
    const nextMonthForecastUsd = avgMonthlyBurnUsd * 1.05;
    const nextMonthForecastKhr = nextMonthForecastUsd * rate;

    // GDT Tax Compliance Index
    const taxComplianceScore = receiptCount > 0 ? Math.round((receiptsWithTinCount / receiptCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      workspaceName: workspace.name,
      baseCurrency: workspace.baseCurrency,
      exchangeRate: rate,
      monthlyBudgetUsd: workspace.monthlyBudgetUsd,
      metrics: {
        totalIncomeUsd,
        totalIncomeKhr,
        totalExpenseUsd,
        totalExpenseKhr,
        netCashflowUsd,
        netCashflowKhr,
        monthlyBurnUsd: avgMonthlyBurnUsd,
        runwayMonths: parseFloat(runwayMonths.toFixed(1)),
        nextMonthForecastUsd: parseFloat(nextMonthForecastUsd.toFixed(2)),
        nextMonthForecastKhr: Math.round(nextMonthForecastKhr),
        taxComplianceScore,
        totalReceipts: receiptCount,
        totalIncomes: workspace.incomes.length,
      },
      distributions: {
        expenseByCategory: expenseByCat,
        expenseByDepartment: expenseByDept,
        incomeByCategory: incomeByCat,
      },
      timeline: Object.entries(monthlyTimeline).map(([month, data]) => ({
        month,
        ...data,
      })),
      anomalies: anomalies.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Error computing analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
