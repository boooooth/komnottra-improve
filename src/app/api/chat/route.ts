import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to access the CFO Chatbot.' },
        { status: 401 }
      );
    }

    // Role check: Chatbot is exclusively for Owners / Finance Leads
    if (session.role !== 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access restricted: The AI CFO Chatbot is reserved exclusively for Workspace Owners.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const userMessage = body.message?.trim();
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    // Fetch workspace with receipts and incomes strictly scoped to workspaceId
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
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
      return NextResponse.json(
        { success: false, error: 'Workspace not found.' },
        { status: 404 }
      );
    }

    // 1. Strict Isolation: Separate Approved vs Pending records
    // Financial reports and analysis must only reflect approved transactions
    const approvedReceipts = workspace.receipts.filter(
      (r: any) => r.status === 'APPROVED' || r.status === 'REIMBURSED'
    );
    const pendingReceipts = workspace.receipts.filter((r: any) => r.status === 'PENDING');
    const approvedIncomes = workspace.incomes.filter((inc: any) => inc.status === 'APPROVED');
    const pendingIncomes = workspace.incomes.filter((inc: any) => inc.status === 'PENDING');

    const exchangeRate = workspace.exchangeRate || 4100;

    let totalExpenseUsd = 0;
    let totalExpenseKhr = 0;
    const categorySpend: Record<string, number> = {};
    const departmentSpend: Record<string, number> = {};
    const recentExpensesList: string[] = [];

    for (const r of approvedReceipts) {
      const usdAmount = r.currency === 'USD' ? r.total : r.total / exchangeRate;
      const khrAmount = r.currency === 'KHR' ? r.total : r.total * exchangeRate;
      totalExpenseUsd += usdAmount;
      totalExpenseKhr += khrAmount;

      const cat = r.expenseCode || 'General';
      categorySpend[cat] = (categorySpend[cat] || 0) + usdAmount;

      const dept = r.department || 'General';
      departmentSpend[dept] = (departmentSpend[dept] || 0) + usdAmount;

      if (recentExpensesList.length < 12) {
        recentExpensesList.push(
          `- ${r.date}: ${r.payee} ($${usdAmount.toFixed(2)} USD / ${Math.round(khrAmount).toLocaleString()} KHR) [Category: ${cat}] [Dept: ${dept}]`
        );
      }
    }

    let totalIncomeUsd = 0;
    let totalIncomeKhr = 0;
    const recentIncomesList: string[] = [];

    for (const inc of approvedIncomes) {
      const usdAmount = inc.currency === 'USD' ? inc.total : inc.total / exchangeRate;
      const khrAmount = inc.currency === 'KHR' ? inc.total : inc.total * exchangeRate;
      totalIncomeUsd += usdAmount;
      totalIncomeKhr += khrAmount;

      if (recentIncomesList.length < 10) {
        recentIncomesList.push(
          `- ${inc.date}: From ${inc.clientName} ($${usdAmount.toFixed(2)} USD / ${Math.round(khrAmount).toLocaleString()} KHR) [Type: ${inc.category}]`
        );
      }
    }

    const netCashflowUsd = totalIncomeUsd - totalExpenseUsd;
    const averageMonthlyBurn = Math.max(
      100,
      totalExpenseUsd / Math.max(1, approvedReceipts.length / 10)
    );
    const estimatedRunwayMonths =
      totalIncomeUsd > 0 ? (totalIncomeUsd / averageMonthlyBurn).toFixed(1) : 'Unknown';

    // 2. Prepare Executive CFO System Prompt
    const systemPrompt = `You are the executive AI Chief Financial Officer (CFO) and financial analyst for "${workspace.name}", a business operating in Cambodia.
You communicate directly with the business owner through the Komnottra Web Chatbot.
Your job is to provide accurate, data-backed financial answers, expense breakdowns, runway forecasts, and actionable CFO recommendations.

RULES & CONSTRAINTS:
1. Always base your numbers strictly on the APPROVED financial facts below.
2. Unapproved items in the Approvals queue are pending and do NOT alter company profits, totals, or cash runway until approved. Mention pending items if relevant to upcoming cash obligations or when asked about approvals.
3. Be professional, supportive, and clear. Use structured markdown (bullet points, bold highlights, concise numbers, and appropriate emojis).
4. Dual-currency awareness: Cambodia uses both USD and Khmer Riel (KHR). Show USD with KHR equivalents where helpful.
5. If the user asks in Khmer, reply fluently and politely in Khmer (ភាសាខ្មែរ). If asked in English, reply in English.

CURRENT WORKSPACE FINANCIAL LEDGER (APPROVED ONLY):
- Workspace Name: ${workspace.name}
- Base Currency: ${workspace.baseCurrency}
- Active Exchange Rate: 1 USD = ${exchangeRate.toLocaleString()} KHR
- Monthly Spending Budget: $${(workspace.monthlyBudgetUsd || 0).toLocaleString()} USD
- Total Approved Incomes: $${totalIncomeUsd.toFixed(2)} USD (${totalIncomeKhr.toLocaleString()} KHR) across ${approvedIncomes.length} records
- Total Approved Expenses: $${totalExpenseUsd.toFixed(2)} USD (${totalExpenseKhr.toLocaleString()} KHR) across ${approvedReceipts.length} receipts
- Net Cashflow Position: ${netCashflowUsd >= 0 ? '+' : '-'}$${Math.abs(netCashflowUsd).toFixed(2)} USD
- Estimated Monthly Burn Rate: ~$${averageMonthlyBurn.toFixed(2)} USD/month
- Projected Cash Runway: ~${estimatedRunwayMonths} months
- Pending Approvals Queue: ${pendingReceipts.length} expenses and ${pendingIncomes.length} incomes pending owner review.

TOP EXPENSE CATEGORIES (APPROVED):
${Object.entries(categorySpend)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `• ${k}: $${v.toFixed(2)} USD (${((v / Math.max(1, totalExpenseUsd)) * 100).toFixed(0)}%)`)
  .join('\n') || 'None recorded yet'}

TOP DEPARTMENTS BY SPEND (APPROVED):
${Object.entries(departmentSpend)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `• ${k}: $${v.toFixed(2)} USD`)
  .join('\n') || 'None recorded yet'}

RECENT APPROVED EXPENSES:
${recentExpensesList.join('\n') || 'No approved expenses yet'}

RECENT APPROVED INCOMES:
${recentIncomesList.join('\n') || 'No approved incomes yet'}`;

    // 3. AI Execution: Direct Gemini API or OmniRoute AI Gateway
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const aiBaseUrl = process.env.AI_BASE_URL;

    // A. Direct Gemini API
    if (geminiApiKey && geminiApiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        // Format history for Gemini
        const contents: any[] = [{ role: 'user', parts: [{ text: systemPrompt }] }];
        for (const msg of history.slice(-6)) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
        });

        const reply = response.text || 'I analyzed your ledger but could not generate a response.';
        return NextResponse.json({ success: true, reply });
      } catch (err: any) {
        console.error('Gemini direct API error in chat route:', err);
      }
    }

    // B. OmniRoute AI Gateway Service
    if (aiBaseUrl) {
      try {
        const apiKey = process.env.AI_API_KEY || 'sk-omniroute';
        const model = process.env.CHAT_MODEL || 'antigravity/gemini-3-flash';

        // Prepare messages array with system prompt and conversation history
        const messages: Array<{ role: string; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        for (const msg of history.slice(-6)) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }

        messages.push({
          role: 'user',
          content: userMessage,
        });

        // Try container host URL, with fallback to localhost if outside docker
        const candidateUrls = [
          aiBaseUrl.replace(/\/$/, ''),
          'http://127.0.0.1:20128/v1',
          'http://localhost:20128/v1',
        ];

        let gatewaySuccess = false;
        let gatewayReply = '';

        for (const url of candidateUrls) {
          try {
            const res = await fetch(`${url}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages,
                temperature: 0.3,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              gatewayReply =
                data.choices?.[0]?.message?.content ||
                'I analyzed your financial ledger but could not format the output.';
              gatewaySuccess = true;
              break;
            }
          } catch {
            // Try next candidate URL
          }
        }

        if (gatewaySuccess && gatewayReply) {
          return NextResponse.json({ success: true, reply: gatewayReply });
        }
      } catch (err: any) {
        console.error('OmniRoute gateway error in chat route:', err);
      }
    }

    // C. Rule-Based Fallback if AI services are unavailable
    const fallbackReply =
      `### 📊 Financial Ledger Summary for **${workspace.name}**\n\n` +
      `Here is a quick snapshot of your approved finances:\n\n` +
      `* **Total Approved Inflow:** $${totalIncomeUsd.toFixed(2)} USD (${totalIncomeKhr.toLocaleString()} ៛)\n` +
      `* **Total Approved Outflow:** $${totalExpenseUsd.toFixed(2)} USD (${totalExpenseKhr.toLocaleString()} ៛)\n` +
      `* **Net Cash Position:** ${netCashflowUsd >= 0 ? '🟢 +$' : '🔴 -$'}${Math.abs(netCashflowUsd).toFixed(2)} USD\n` +
      `* **Monthly Burn Rate:** ~$${averageMonthlyBurn.toFixed(2)} USD / month\n` +
      `* **Estimated Runway:** ~${estimatedRunwayMonths} months\n` +
      `* **Pending Approvals Queue:** ${pendingReceipts.length} expenses · ${pendingIncomes.length} incomes waiting in Approvals.\n\n` +
      `*(Note: AI conversational engine is currently operating in offline summary mode.)*`;

    return NextResponse.json({ success: true, reply: fallbackReply });
  } catch (err: any) {
    console.error('Unexpected error in /api/chat:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing message.' },
      { status: 500 }
    );
  }
}
