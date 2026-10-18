import { prisma } from './prisma';
import { GoogleGenAI } from '@google/genai';

export interface TelegramSendMessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: any;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        reply_markup: options?.replyMarkup,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return { ok: false, error: data.description };
    }
    return { ok: true, result: data.result };
  } catch (err: any) {
    console.error('Telegram request failed:', err);
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * Test Telegram bot connection and send test message
 */
export async function testTelegramConnection(
  token: string,
  chatId: string,
  workspaceName: string
): Promise<{ success: boolean; botUsername?: string; error?: string }> {
  try {
    // 1. Verify token
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      return { success: false, error: `Invalid Bot Token: ${meData.description}` };
    }

    const botUsername = meData.result.username;

    // 2. If chatId provided, send test ping
    if (chatId) {
      const pingText = `<b>🤖 Komnottra CFO Bot Connected!</b>\n\n` +
        `✅ Successfully linked to workspace: <b>${workspaceName}</b>\n` +
        `📈 You will now receive live alerts for large expenses, income, anomalies, and daily digests.\n\n` +
        `<i>💬 You can message this bot anytime to ask about your company cashflow, spendings, or runway predictions!</i>`;

      const sendRes = await sendTelegramMessage(token, chatId, pingText);
      if (!sendRes.ok) {
        return {
          success: false,
          botUsername,
          error: `Bot token is valid (@${botUsername}), but failed to message Chat ID ${chatId}: ${sendRes.error}. (Make sure you clicked Start on the bot first!)`,
        };
      }
    }

    return { success: true, botUsername };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection test failed' };
  }
}

export type WorkspaceAlertType =
  | 'HIGH_SPEND'
  | 'NEW_INCOME'
  | 'ANOMALY'
  | 'BUDGET_WARNING'
  | 'DAILY_DIGEST';

/**
 * Trigger an automated workspace alert via Telegram
 */
export async function notifyWorkspaceAlert(
  workspaceId: string,
  alertType: WorkspaceAlertType,
  payload: Record<string, any>
): Promise<boolean> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || !workspace.telegramBotActive || !workspace.telegramBotToken || !workspace.telegramChatId) {
      return false;
    }

    let message = '';

    switch (alertType) {
      case 'HIGH_SPEND': {
        if (!workspace.notifyHighSpend) return false;
        const amountUsd = payload.amountUsd || 0;
        if (amountUsd < workspace.notifyHighSpendMin) return false;

        message =
          `🚨 <b>High Expense Alert ($${amountUsd.toFixed(2)})</b>\n\n` +
          `• <b>Payee:</b> ${payload.payee || 'Unknown'}\n` +
          `• <b>Claimant:</b> ${payload.claimantName || 'Staff Member'}\n` +
          `• <b>Category:</b> ${payload.category || 'General'}\n` +
          `• <b>Department:</b> ${payload.department || '—'}\n` +
          `• <b>Total:</b> ${payload.totalFormatted || `$${amountUsd}`}\n` +
          `• <b>Date:</b> ${payload.date || new Date().toLocaleDateString('en-GB')}\n\n` +
          `<i>Pending approval in Komnottra ledger.</i>`;
        break;
      }

      case 'NEW_INCOME': {
        if (!workspace.notifyNewIncome) return false;
        message =
          `💵 <b>Company Inflow Recorded</b>\n\n` +
          `• <b>Client/Source:</b> ${payload.clientName || 'Direct Client'}\n` +
          `• <b>Amount:</b> ${payload.totalFormatted || `$${payload.total}`}\n` +
          `• <b>Category:</b> ${payload.category || 'Revenue'}\n` +
          `• <b>Method:</b> ${payload.paymentMethod || 'Bank Transfer'}\n` +
          `• <b>Invoice #:</b> ${payload.invoiceNo || 'N/A'}\n\n` +
          `<i>Cashflow balance updated in real-time.</i>`;
        break;
      }

      case 'ANOMALY': {
        if (!workspace.notifyAnomalies) return false;
        message =
          `⚠️ <b>Spending Anomaly Detected</b>\n\n` +
          `• <b>Reason:</b> ${payload.reason || 'Duplicate receipt or suspicious value'}\n` +
          `• <b>Payee:</b> ${payload.payee || '—'}\n` +
          `• <b>Amount:</b> ${payload.amountFormatted || '—'}\n` +
          `• <b>Claimant:</b> ${payload.claimantName || '—'}\n\n` +
          `<i>Please review in your approvals ledger before releasing reimbursement.</i>`;
        break;
      }

      case 'BUDGET_WARNING': {
        if (!workspace.notifyBudgetAlert) return false;
        message =
          `🛑 <b>Budget Threshold Reached (${payload.percentage || '80'}%)</b>\n\n` +
          `• <b>Monthly Budget:</b> $${workspace.monthlyBudgetUsd.toLocaleString()}\n` +
          `• <b>Current Spend:</b> $${(payload.currentSpend || 0).toLocaleString()}\n` +
          `• <b>Remaining:</b> $${(payload.remaining || 0).toLocaleString()}\n\n` +
          `<i>Recommendation: Slow non-critical departmental expenditures.</i>`;
        break;
      }

      case 'DAILY_DIGEST': {
        if (!workspace.notifyDailyDigest) return false;
        message =
          `☀️ <b>Morning CFO Briefing: ${workspace.name}</b>\n\n` +
          `• <b>Yesterday's Spend:</b> $${(payload.yesterdaySpend || 0).toFixed(2)}\n` +
          `• <b>Month-To-Date Inflow:</b> $${(payload.mtdIncome || 0).toFixed(2)}\n` +
          `• <b>Month-To-Date Outflow:</b> $${(payload.mtdExpense || 0).toFixed(2)}\n` +
          `• <b>Net Cashflow:</b> ${payload.netCashflow >= 0 ? '🟢 +' : '🔴 -'}$${Math.abs(payload.netCashflow || 0).toFixed(2)}\n` +
          `• <b>Estimated Runway:</b> ${payload.runwayMonths ? `${payload.runwayMonths} months` : 'N/A'}\n\n` +
          `<i>Reply to this bot to ask any questions about your financials!</i>`;
        break;
      }
    }

    if (!message) return false;

    const res = await sendTelegramMessage(workspace.telegramBotToken, workspace.telegramChatId, message);
    return res.ok;
  } catch (err) {
    console.error('Failed to notify workspace alert:', err);
    return false;
  }
}

/**
 * AI Conversational Agent: Handles owner questions in Telegram about their company data
 */
export async function askWorkspaceCfoAgent(workspaceId: string, userQuery: string): Promise<string> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        receipts: {
          orderBy: { createdAt: 'desc' },
          take: 60,
        },
        incomes: {
          orderBy: { createdAt: 'desc' },
          take: 40,
        },
      },
    });

    if (!workspace) {
      return "Workspace not found. Please connect your bot to a valid Komnottra workspace.";
    }

    // 1. Calculate Financial Summary Context
    let totalExpenseUsd = 0;
    let totalExpenseKhr = 0;
    const categorySpend: Record<string, number> = {};
    const departmentSpend: Record<string, number> = {};
    const recentExpensesList: string[] = [];

    for (const r of workspace.receipts) {
      const usdAmount = r.currency === 'USD' ? r.total : r.total / (workspace.exchangeRate || 4100);
      const khrAmount = r.currency === 'KHR' ? r.total : r.total * (workspace.exchangeRate || 4100);
      totalExpenseUsd += usdAmount;
      totalExpenseKhr += khrAmount;

      const cat = r.expenseCode || 'General';
      categorySpend[cat] = (categorySpend[cat] || 0) + usdAmount;

      const dept = r.department || 'General';
      departmentSpend[dept] = (departmentSpend[dept] || 0) + usdAmount;

      if (recentExpensesList.length < 15) {
        recentExpensesList.push(`- ${r.date}: ${r.payee} (${r.total} ${r.currency}) [Dept: ${r.department || '—'}] Status: ${r.status}`);
      }
    }

    let totalIncomeUsd = 0;
    let totalIncomeKhr = 0;
    const recentIncomesList: string[] = [];

    for (const inc of workspace.incomes) {
      const usdAmount = inc.currency === 'USD' ? inc.total : inc.total / (workspace.exchangeRate || 4100);
      const khrAmount = inc.currency === 'KHR' ? inc.total : inc.total * (workspace.exchangeRate || 4100);
      totalIncomeUsd += usdAmount;
      totalIncomeKhr += khrAmount;

      if (recentIncomesList.length < 10) {
        recentIncomesList.push(`- ${inc.date}: From ${inc.clientName} (${inc.total} ${inc.currency}) Status: ${inc.status}`);
      }
    }

    const netCashflowUsd = totalIncomeUsd - totalExpenseUsd;
    const averageMonthlyBurn = Math.max(100, totalExpenseUsd / (Math.max(1, workspace.receipts.length / 10)));
    const estimatedRunwayMonths = totalIncomeUsd > 0 ? (totalIncomeUsd / averageMonthlyBurn).toFixed(1) : 'Unknown';

    // 2. Prepare AI Prompt
    const systemPrompt = `You are the executive AI Chief Financial Officer (CFO) and financial analyst for "${workspace.name}", an organization operating in Cambodia.
You communicate directly with the company owner via Telegram.
Respond in clear, professional, concise language with bullet points and emojis. If asked in Khmer, answer in natural polite Khmer; if asked in English, answer in English.

CURRENT WORKSPACE FINANCIAL FACTS:
- Active Base Currency: ${workspace.baseCurrency}
- Active Exchange Rate: 1 USD = ${workspace.exchangeRate} KHR
- Monthly Budget: $${workspace.monthlyBudgetUsd}
- Total Logged Expenses: $${totalExpenseUsd.toFixed(2)} USD (${totalExpenseKhr.toLocaleString()} KHR) across ${workspace.receipts.length} receipts
- Total Logged Income: $${totalIncomeUsd.toFixed(2)} USD (${totalIncomeKhr.toLocaleString()} KHR) across ${workspace.incomes.length} records
- Net Cashflow: ${netCashflowUsd >= 0 ? '+' : '-'}$${Math.abs(netCashflowUsd).toFixed(2)} USD
- Estimated Monthly Burn Rate: ~$${averageMonthlyBurn.toFixed(2)} USD
- Projected Cash Runway: ~${estimatedRunwayMonths} months

TOP CATEGORY SPEND:
${Object.entries(categorySpend).map(([k, v]) => `• ${k}: $${v.toFixed(2)}`).join('\n') || 'None recorded yet'}

TOP DEPARTMENT SPEND:
${Object.entries(departmentSpend).map(([k, v]) => `• ${k}: $${v.toFixed(2)}`).join('\n') || 'None recorded yet'}

RECENT EXPENSES:
${recentExpensesList.join('\n') || 'None recorded'}

RECENT INCOME / INFLOWS:
${recentIncomesList.join('\n') || 'None recorded'}

USER QUERY:
"${userQuery}"

Provide a direct, accurate, data-backed answer based on the real financial ledger above. If predicting, give realistic forecasts based on the numbers and suggest 1-2 actionable CFO recommendations. Keep it under 250 words so it reads cleanly on a mobile Telegram screen.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL;

    // Direct Gemini
    if (geminiApiKey && geminiApiKey.trim().length > 0) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      });
      return response.text || "I was unable to analyze the financial data at this moment.";
    }

    // Fallback to OmniRoute / AI Gateway
    if (aiBaseUrl) {
      const apiKey = process.env.AI_API_KEY || 'sk-omniroute';
      const model = process.env.CHAT_MODEL || 'serka-space';
      const res = await fetch(`${aiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "I reviewed your ledger but could not generate a response.";
      }
    }

    // Rule-based fallback if no AI API configured
    return `📊 <b>Financial Overview for ${workspace.name}</b>\n\n` +
      `• <b>Total Spend:</b> $${totalExpenseUsd.toFixed(2)} (${totalExpenseKhr.toLocaleString()} ៛)\n` +
      `• <b>Total Income:</b> $${totalIncomeUsd.toFixed(2)}\n` +
      `• <b>Net Position:</b> ${netCashflowUsd >= 0 ? '🟢 +' : '🔴 -'}$${Math.abs(netCashflowUsd).toFixed(2)}\n` +
      `• <b>Burn Rate:</b> ~$${averageMonthlyBurn.toFixed(2)}/mo\n\n` +
      `<i>Configure GEMINI_API_KEY or AI_BASE_URL for conversational natural language insights.</i>`;
  } catch (err: any) {
    console.error('Error in askWorkspaceCfoAgent:', err);
    return `❌ An error occurred while analyzing your workspace data: ${err.message}`;
  }
}
