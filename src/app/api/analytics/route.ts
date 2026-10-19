import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function parseDateComponents(dateStr?: string | null, createdAt?: Date | string | null): {
  day: number;
  month: number;
  year: number;
  monthKey: string;
  yearKey: string;
  fullDateStr: string;
} {
  if (dateStr && typeof dateStr === 'string') {
    // DD/MM/YYYY
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10);
      const year = parseInt(ddmmyyyy[3], 10);
      return {
        day,
        month,
        year,
        monthKey: `${String(month).padStart(2, '0')}/${year}`,
        yearKey: String(year),
        fullDateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      };
    }
    // YYYY-MM-DD
    const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10);
      const day = parseInt(yyyymmdd[3], 10);
      return {
        day,
        month,
        year,
        monthKey: `${String(month).padStart(2, '0')}/${year}`,
        yearKey: String(year),
        fullDateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
      };
    }
  }

  const d = createdAt ? new Date(createdAt) : new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return {
    day,
    month,
    year,
    monthKey: `${String(month).padStart(2, '0')}/${year}`,
    yearKey: String(year),
    fullDateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
  };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

    // Period filter parameters
    const requestedPeriod = req.nextUrl.searchParams.get('period') || 'ALL'; // THIS_MONTH | LAST_MONTH | THIS_YEAR | ALL | CUSTOM_MONTH
    const requestedMonth = req.nextUrl.searchParams.get('month') || ''; // e.g. "10/2026"

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${String(currentMonth).padStart(2, '0')}/${currentYear}`;

    const lastMonthVal = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastMonthKey = `${String(lastMonthVal).padStart(2, '0')}/${lastMonthYear}`;
    const currentYearKey = String(currentYear);

    // Separate Approved vs Pending
    const approvedReceipts = workspace.receipts.filter((r: any) => r.status === 'APPROVED' || r.status === 'REIMBURSED');
    const pendingReceipts = workspace.receipts.filter((r: any) => r.status === 'PENDING');
    const approvedIncomes = workspace.incomes.filter((inc: any) => inc.status === 'APPROVED');
    const pendingIncomes = workspace.incomes.filter((inc: any) => inc.status === 'PENDING');

    // Collect all available months across receipts and incomes
    const monthMap = new Map<string, { key: string; label: string; count: number; year: number; month: number }>();

    const registerMonth = (dateInfo: { month: number; year: number; monthKey: string }) => {
      const existing = monthMap.get(dateInfo.monthKey);
      if (existing) {
        existing.count++;
      } else {
        monthMap.set(dateInfo.monthKey, {
          key: dateInfo.monthKey,
          label: `${MONTH_NAMES[dateInfo.month - 1]} ${dateInfo.year}`,
          count: 1,
          year: dateInfo.year,
          month: dateInfo.month,
        });
      }
    };

    // Global monthly timeline aggregation (for the comparison chart)
    const monthlyTimeline: Record<string, { incomeUsd: number; expenseUsd: number; netUsd: number; count: number }> = {};

    let lifetimeExpenseUsd = 0;
    let lifetimeIncomeUsd = 0;

    // Scan receipts for global timeline & available months
    for (const r of approvedReceipts) {
      const usd = r.currency === 'USD' ? r.total : r.total / rate;
      lifetimeExpenseUsd += usd;

      const dateInfo = parseDateComponents(r.date, r.createdAt);
      registerMonth(dateInfo);

      if (!monthlyTimeline[dateInfo.monthKey]) {
        monthlyTimeline[dateInfo.monthKey] = { incomeUsd: 0, expenseUsd: 0, netUsd: 0, count: 0 };
      }
      monthlyTimeline[dateInfo.monthKey].expenseUsd += usd;
      monthlyTimeline[dateInfo.monthKey].count++;
    }

    // Scan incomes for global timeline & available months
    for (const inc of approvedIncomes) {
      const usd = inc.currency === 'USD' ? inc.total : inc.total / rate;
      lifetimeIncomeUsd += usd;

      const dateInfo = parseDateComponents(inc.date, inc.createdAt);
      registerMonth(dateInfo);

      if (!monthlyTimeline[dateInfo.monthKey]) {
        monthlyTimeline[dateInfo.monthKey] = { incomeUsd: 0, expenseUsd: 0, netUsd: 0, count: 0 };
      }
      monthlyTimeline[dateInfo.monthKey].incomeUsd += usd;
      monthlyTimeline[dateInfo.monthKey].count++;
    }

    // Compute net for all months in the timeline
    for (const m of Object.keys(monthlyTimeline)) {
      monthlyTimeline[m].netUsd = monthlyTimeline[m].incomeUsd - monthlyTimeline[m].expenseUsd;
    }

    // Available months list sorted in reverse chronological order
    const availableMonths = Array.from(monthMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Check if item belongs to current active filter period
    const isIncludedInPeriod = (dateInfo: { monthKey: string; yearKey: string }) => {
      if (requestedPeriod === 'THIS_MONTH') return dateInfo.monthKey === currentMonthKey;
      if (requestedPeriod === 'LAST_MONTH') return dateInfo.monthKey === lastMonthKey;
      if (requestedPeriod === 'THIS_YEAR') return dateInfo.yearKey === currentYearKey;
      if (requestedPeriod === 'CUSTOM_MONTH') return dateInfo.monthKey === requestedMonth;
      return true; // 'ALL'
    };

    // Calculate metrics for filtered period
    let periodExpenseUsd = 0;
    let periodExpenseKhr = 0;
    let periodReceiptsWithTinCount = 0;
    const expenseByCat: Record<string, { usd: number; khr: number; count: number }> = {};
    const expenseByDept: Record<string, { usd: number; count: number }> = {};
    const filteredApprovedReceipts: any[] = [];
    const outflowSparkline: Array<{ label: string; amount: number; payee: string }> = [];

    const seenReceipts = new Set<string>();
    const anomalies: Array<{ id: string; type: string; title: string; description: string; date: string }> = [];

    for (const r of approvedReceipts) {
      const dateInfo = parseDateComponents(r.date, r.createdAt);
      const inPeriod = isIncludedInPeriod(dateInfo);

      const usd = r.currency === 'USD' ? r.total : r.total / rate;
      const khr = r.currency === 'KHR' ? r.total : r.total * rate;

      // Duplicate check across history
      const dupeKey = `${r.payee?.toLowerCase().trim()}_${r.date}_${r.total}`;
      const isDupe = seenReceipts.has(dupeKey);
      if (isDupe) {
        if (inPeriod) {
          anomalies.push({
            id: r.id,
            type: 'DUPLICATE',
            title: `Potential Duplicate: ${r.payee}`,
            description: `Identical amount (${r.total} ${r.currency}) on ${r.date}`,
            date: r.date,
          });
        }
      } else {
        seenReceipts.add(dupeKey);
      }

      // High spend anomaly
      if (usd >= (workspace.notifyHighSpendMin || 100)) {
        if (inPeriod) {
          anomalies.push({
            id: r.id,
            type: 'HIGH_VALUE',
            title: `High Claim: ${r.payee} ($${usd.toFixed(2)})`,
            description: `Filed under ${r.department || 'General'} on ${r.date}`,
            date: r.date,
          });
        }
      }

      if (inPeriod) {
        filteredApprovedReceipts.push(r);
        periodExpenseUsd += usd;
        periodExpenseKhr += khr;

        if (r.vendorTin && r.vendorTin !== '—' && r.vendorTin.trim().length > 3) {
          periodReceiptsWithTinCount++;
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

        outflowSparkline.push({
          label: dateInfo.fullDateStr,
          amount: parseFloat(usd.toFixed(2)),
          payee: r.payee || 'Expense',
        });
      }
    }

    // Sort outflow sparkline chronologically
    outflowSparkline.reverse();

    // Filter incomes
    let periodIncomeUsd = 0;
    let periodIncomeKhr = 0;
    const incomeByCat: Record<string, { usd: number; count: number }> = {};
    const filteredApprovedIncomes: any[] = [];
    const inflowSparkline: Array<{ label: string; amount: number; client: string }> = [];

    for (const inc of approvedIncomes) {
      const dateInfo = parseDateComponents(inc.date, inc.createdAt);
      if (isIncludedInPeriod(dateInfo)) {
        filteredApprovedIncomes.push(inc);
        const usd = inc.currency === 'USD' ? inc.total : inc.total / rate;
        const khr = inc.currency === 'KHR' ? inc.total : inc.total * rate;
        periodIncomeUsd += usd;
        periodIncomeKhr += khr;

        const cat = inc.category || 'Client Services';
        if (!incomeByCat[cat]) incomeByCat[cat] = { usd: 0, count: 0 };
        incomeByCat[cat].usd += usd;
        incomeByCat[cat].count++;

        inflowSparkline.push({
          label: dateInfo.fullDateStr,
          amount: parseFloat(usd.toFixed(2)),
          client: inc.clientName || 'Client',
        });
      }
    }

    inflowSparkline.reverse();

    const periodNetCashflowUsd = periodIncomeUsd - periodExpenseUsd;
    const periodNetCashflowKhr = periodIncomeKhr - periodExpenseKhr;

    // AI Predictive Analytics & Runway Calculation
    const activeReceiptCount = filteredApprovedReceipts.length;
    const lifetimeNetTreasuryUsd = Math.max(0, lifetimeIncomeUsd - lifetimeExpenseUsd);

    // Monthly burn calculation based on selected period
    let effectiveMonthlyBurnUsd = 0;
    if (requestedPeriod === 'THIS_MONTH' || requestedPeriod === 'CUSTOM_MONTH' || requestedPeriod === 'LAST_MONTH') {
      effectiveMonthlyBurnUsd = periodExpenseUsd > 0 ? periodExpenseUsd : Math.max(50, lifetimeExpenseUsd / Math.max(1, availableMonths.length));
    } else if (requestedPeriod === 'THIS_YEAR') {
      const monthsElapsed = Math.max(1, currentMonth);
      effectiveMonthlyBurnUsd = periodExpenseUsd / monthsElapsed;
    } else {
      // ALL
      const totalMonthsWithData = Math.max(1, availableMonths.length);
      effectiveMonthlyBurnUsd = Math.max(50, lifetimeExpenseUsd / totalMonthsWithData);
    }

    const runwayMonths = effectiveMonthlyBurnUsd > 0 ? lifetimeNetTreasuryUsd / effectiveMonthlyBurnUsd : 0;

    // 30-Day AI Forecast
    const nextMonthForecastUsd = effectiveMonthlyBurnUsd > 0 ? effectiveMonthlyBurnUsd * 1.05 : 100;
    const nextMonthForecastKhr = nextMonthForecastUsd * rate;

    // Tax Compliance Index
    const taxComplianceScore = activeReceiptCount > 0 ? Math.round((periodReceiptsWithTinCount / activeReceiptCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      workspaceName: workspace.name,
      baseCurrency: workspace.baseCurrency,
      exchangeRate: rate,
      monthlyBudgetUsd: workspace.monthlyBudgetUsd,
      period: {
        active: requestedPeriod,
        month: requestedMonth,
        currentMonthKey,
        currentYearKey,
        availableMonths,
      },
      metrics: {
        totalIncomeUsd: periodIncomeUsd,
        totalIncomeKhr: periodIncomeKhr,
        totalExpenseUsd: periodExpenseUsd,
        totalExpenseKhr: periodExpenseKhr,
        netCashflowUsd: periodNetCashflowUsd,
        netCashflowKhr: periodNetCashflowKhr,
        monthlyBurnUsd: effectiveMonthlyBurnUsd,
        runwayMonths: parseFloat(runwayMonths.toFixed(1)),
        nextMonthForecastUsd: parseFloat(nextMonthForecastUsd.toFixed(2)),
        nextMonthForecastKhr: Math.round(nextMonthForecastKhr),
        taxComplianceScore,
        receiptsWithTinCount: periodReceiptsWithTinCount,
        totalReceipts: activeReceiptCount,
        totalIncomes: filteredApprovedIncomes.length,
        lifetimeTreasuryUsd: lifetimeNetTreasuryUsd,
        pendingApprovals: {
          receipts: pendingReceipts.length,
          incomes: pendingIncomes.length,
          total: pendingReceipts.length + pendingIncomes.length,
        },
      },
      sparklines: {
        outflow: outflowSparkline,
        inflow: inflowSparkline,
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
