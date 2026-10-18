import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, askWorkspaceCfoAgent } from '@/lib/telegram';
import { extractReceiptWithGemini } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update.message || update.edited_message;
    if (!message || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text?.trim() || message.caption?.trim() || '';

    // 1. Try to find workspace by telegramChatId
    let workspace = await prisma.workspace.findFirst({
      where: { telegramChatId: chatId },
    });

    // 2. Handle /start command (supports binding via /start <inviteCode>)
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const inviteCode = parts[1]?.trim();

      if (inviteCode) {
        const found = await prisma.workspace.findUnique({
          where: { inviteCode },
        });

        if (found) {
          workspace = await prisma.workspace.update({
            where: { id: found.id },
            data: {
              telegramChatId: chatId,
              telegramBotActive: true,
            },
          });

          const token = workspace.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
          if (token) {
            await sendTelegramMessage(
              token,
              chatId,
              `🎉 <b>Connected to ${workspace.name}!</b>\n\n` +
                `This Telegram chat is now officially paired with your <b>Komnottra</b> workspace ledger.\n\n` +
                `<b>What you can do:</b>\n` +
                `• 💬 Ask financial questions (e.g. <i>"What's our spend this week?"</i>, <i>"Show top categories"</i>, <i>"Predict next month burn"</i>)\n` +
                `• 📸 Send or forward receipt photos here to auto-scan into your ledger\n` +
                `• 🚨 Receive instant alerts for high-value claims, new income, and morning digests\n\n` +
                `Type /help anytime to see available commands.`
            );
          }
          return NextResponse.json({ ok: true });
        }
      }

      if (!workspace) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (token) {
          await sendTelegramMessage(
            token,
            chatId,
            `👋 <b>Welcome to Komnottra CFO Bot!</b>\n\n` +
              `To link this bot to your workspace, send:\n` +
              `<code>/start YOUR_WORKSPACE_INVITE_CODE</code>\n\n` +
              `<i>You can find your invite code in the Komnottra web dashboard under Settings &rarr; Telegram Integration.</i>`
          );
        }
        return NextResponse.json({ ok: true });
      }
    }

    if (!workspace) {
      return NextResponse.json({ ok: true });
    }

    const token = workspace.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: true });
    }

    // 3. Handle Receipt Photo Upload directly in Telegram
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      await sendTelegramMessage(token, chatId, `⏳ <i>Scanning receipt with Gemini Vision...</i>`);

      const photoObj = message.photo[message.photo.length - 1]; // Highest resolution
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photoObj.file_id}`);
      const fileData = await fileRes.json();

      if (fileData.ok && fileData.result?.file_path) {
        const filePath = fileData.result.file_path;
        const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const base64 = buffer.toString('base64');

        // Save local file copy
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `tg_${Date.now()}_receipt.jpg`;
        const localPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localPath, buffer);
        const imageUrl = `/uploads/${fileName}`;

        // Parse custom departments & categories
        let customCategories: string[] = [];
        let customDepartments: string[] = [];
        try {
          customCategories = JSON.parse(workspace.expenseCodes || '[]');
          customDepartments = JSON.parse(workspace.departments || '[]');
        } catch (_) {}

        const parsed = await extractReceiptWithGemini(base64, 'image/jpeg', {
          categories: customCategories,
          departments: customDepartments,
        });

        if (parsed) {
          // Find or fallback to owner user
          const ownerUser = await prisma.user.findFirst({
            where: { workspaceId: workspace.id, role: 'OWNER' },
          });

          if (ownerUser) {
            const activeRate = workspace.exchangeRate || 4100;
            const isUsd = parsed.currency === 'USD';
            let totalBaseEquiv = 0;
            if (workspace.baseCurrency === 'USD') {
              totalBaseEquiv = isUsd ? parsed.total : parsed.total / activeRate;
            } else {
              totalBaseEquiv = isUsd ? parsed.total * activeRate : parsed.total;
            }

            const receipt = await prisma.receipt.create({
              data: {
                workspaceId: workspace.id,
                claimantId: ownerUser.id,
                date: parsed.date,
                receiptNo: parsed.receiptNo || `TG-${Date.now().toString().slice(-4)}`,
                payee: parsed.vendor || 'Merchant',
                vendorTin: parsed.vendorTin || '—',
                description: parsed.note || 'Telegram uploaded receipt',
                department: parsed.department || 'General',
                expenseCode: parsed.category || 'General',
                paymentMethod: 'Telegram Upload',
                currency: parsed.currency,
                rate: activeRate,
                amountExclVat: parsed.amountExclVat,
                vat: parsed.vat,
                total: parsed.total,
                totalBaseEquiv,
                status: 'APPROVED',
                imageUrl,
                rawExtractedJson: JSON.stringify(parsed),
              },
            });

            await sendTelegramMessage(
              token,
              chatId,
              `✅ <b>Receipt Scanned & Logged!</b>\n\n` +
                `• <b>Merchant:</b> ${parsed.vendor}\n` +
                `• <b>Amount:</b> ${parsed.total} ${parsed.currency}\n` +
                `• <b>Date:</b> ${parsed.date}\n` +
                `• <b>Category:</b> ${parsed.category}\n` +
                `• <b>TIN:</b> ${parsed.vendorTin || '—'}\n` +
                `• <b>Claim ID:</b> #${receipt.receiptNo}\n\n` +
                `<i>Auto-synced into ${workspace.name} ledger.</i>`
            );
            return NextResponse.json({ ok: true });
          }
        }
      }

      await sendTelegramMessage(
        token,
        chatId,
        `⚠️ Could not clearly read the receipt details. Please ensure the image is bright and unblurred.`
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Handle Text Commands & AI Natural Q&A
    if (text === '/help') {
      await sendTelegramMessage(
        token,
        chatId,
        `🤖 <b>Komnottra CFO Bot Commands:</b>\n\n` +
          `• <b>/summary</b> - Get month-to-date cashflow summary\n` +
          `• <b>/runway</b> - Check cash runway & monthly burn\n` +
          `• <b>/forecast</b> - 30-day predictive expense projection\n` +
          `• <b>📸 Photo</b> - Snap a receipt photo to log directly\n\n` +
          `<i>Or just ask me any question naturally, like:</i>\n` +
          `• <i>"How much did we spend on utilities this month?"</i>\n` +
          `• <i>"What's our net profit in USD and Riel?"</i>\n` +
          `• <i>"Who submitted the largest claim recently?"</i>`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/summary') {
      const reply = await askWorkspaceCfoAgent(workspace.id, "Give me an executive summary of our month-to-date spend, income, and net position.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (text === '/runway') {
      const reply = await askWorkspaceCfoAgent(workspace.id, "Calculate our cash runway and monthly burn rate in detail with recommendations.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (text === '/forecast') {
      const reply = await askWorkspaceCfoAgent(workspace.id, "Predict our next 30 days expense liability based on historical burn.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    // 5. General Natural Language Q&A with AI CFO
    const aiAnswer = await askWorkspaceCfoAgent(workspace.id, text);
    await sendTelegramMessage(token, chatId, aiAnswer);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
