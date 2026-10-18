import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, askWorkspaceAgent, notifyWorkspaceAlert } from '@/lib/telegram';
import { extractReceiptWithGemini } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

// In-memory cache to deduplicate Telegram webhook retries
const processedUpdates = new Map<number, number>();

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Deduplicate webhook retries from Telegram
    if (update.update_id) {
      if (processedUpdates.has(update.update_id)) {
        return NextResponse.json({ ok: true });
      }
      processedUpdates.set(update.update_id, Date.now());
      if (processedUpdates.size > 1000) {
        const tenMinsAgo = Date.now() - 10 * 60 * 1000;
        for (const [id, ts] of processedUpdates.entries()) {
          if (ts < tenMinsAgo) processedUpdates.delete(id);
        }
      }
    }

    // Handle Telegram Inline Keyboard button clicks (callback_query)
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackData = cq.data || '';
      const cqChatId = String(cq.message?.chat?.id || cq.from?.id);
      const messageId = cq.message?.message_id;

      const ws = await prisma.workspace.findFirst({
        where: {
          OR: [
            { telegramChatId: cqChatId },
            { telegramChatId: { contains: cqChatId } },
          ],
        },
      });

      const token = ws?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

      // Stop button loading spinner
      if (token && cq.id) {
        fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: cq.id }),
        }).catch(() => {});
      }

      // Convert from Expense to Income
      if (callbackData.startsWith('type_inc:') && ws) {
        const receiptId = callbackData.replace('type_inc:', '');
        const r = await prisma.receipt.findUnique({ where: { id: receiptId } });
        if (r) {
          await prisma.income.create({
            data: {
              workspaceId: ws.id,
              date: r.date,
              invoiceNo: r.receiptNo,
              clientName: r.payee,
              clientTin: r.vendorTin !== '—' ? r.vendorTin : null,
              description: r.description,
              category: 'Client Services',
              paymentMethod: r.paymentMethod || 'Telegram Upload',
              currency: r.currency,
              rate: r.rate,
              amountExclVat: r.amountExclVat,
              vat: r.vat,
              total: r.total,
              totalBaseEquiv: r.totalBaseEquiv,
              status: 'PENDING',
              submittedBy: r.submittedBy,
            },
          });
          await prisma.receipt.delete({ where: { id: receiptId } });

          if (token && messageId) {
            await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: cqChatId,
                message_id: messageId,
                parse_mode: 'HTML',
                text: `<b>Recorded as Company Inflow (Pending Review)</b>\n\n` +
                  `• <b>Client/Source:</b> ${r.payee}\n` +
                  `• <b>Amount:</b> ${r.total} ${r.currency}\n` +
                  `• <b>Date:</b> ${r.date}\n` +
                  `• <b>Submitted By:</b> ${r.submittedBy || 'Telegram User'}\n\n` +
                  `<i>Sent to Approvals tab for owner review. No alert sent.</i>`,
              }),
            });
          }
        }
        return NextResponse.json({ ok: true });
      }

      // Keep as Expense (Pending Review)
      if (callbackData.startsWith('type_exp:') && ws) {
        const receiptId = callbackData.replace('type_exp:', '');
        const r = await prisma.receipt.findUnique({ where: { id: receiptId } });
        if (r && token && messageId) {
          // Trigger High-Spend Alert to Owner ONLY when confirmed as an Expense
          const isUsd = r.currency === 'USD';
          const rateVal = r.rate || ws.exchangeRate || 4100;
          const usdVal = isUsd ? r.total : r.total / rateVal;

          if (usdVal >= (ws.notifyHighSpendMin || 100) && ws.notifyHighSpend) {
            notifyWorkspaceAlert(ws.id, 'HIGH_SPEND', {
              payee: r.payee,
              amountUsd: usdVal,
              totalFormatted: isUsd ? `$${r.total.toFixed(2)}` : `${r.total.toLocaleString()} ៛`,
              claimantName: r.submittedBy || 'Telegram User',
              category: r.expenseCode || 'General',
              department: r.department || 'General',
              date: r.date,
            }).catch((e) => console.error('Telegram receipt alert error:', e));
          }

          await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cqChatId,
              message_id: messageId,
              parse_mode: 'HTML',
              text: `<b>Confirmed as Company Expense (Pending Review)</b>\n\n` +
                `• <b>Merchant:</b> ${r.payee}\n` +
                `• <b>Amount:</b> ${r.total} ${r.currency}\n` +
                `• <b>Date:</b> ${r.date}\n` +
                `• <b>Category:</b> ${r.expenseCode}\n` +
                `• <b>Submitted By:</b> ${r.submittedBy || 'Telegram User'}\n\n` +
                `<i>Sent to Approvals tab for owner review.</i>`,
            }),
          });
        }
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    const message = update.message || update.edited_message;
    if (!message || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text?.trim() || message.caption?.trim() || '';

    // Sender Telegram display name
    const fromUser = message.from;
    const telegramSenderName = fromUser
      ? [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') + (fromUser.username ? ` (@${fromUser.username})` : '')
      : 'Telegram User';

    // 1. Try to find workspace by owner telegramChatId OR member telegramMemberChatIds
    let workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { telegramChatId: chatId },
          { telegramChatId: { contains: chatId } },
          { telegramMemberChatIds: chatId },
          { telegramMemberChatIds: { contains: chatId } },
        ],
      },
    });

    const ownerIds = (workspace?.telegramChatId || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const memberIds = (workspace?.telegramMemberChatIds || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const isOwner = ownerIds.includes(chatId);
    const isMember = memberIds.includes(chatId);

    // 2. Handle /start and /myid commands
    if (text.startsWith('/start') || text === '/myid') {
      const parts = text.split(' ');
      const possibleCode = parts[1]?.trim();

      // Legacy fallback: if someone still passed an inviteCode
      if (possibleCode) {
        const found = await prisma.workspace.findUnique({
          where: { inviteCode: possibleCode },
        });

        if (found) {
          const existingIds = (found.telegramMemberChatIds || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (!existingIds.includes(chatId)) {
            existingIds.push(chatId);
          }

          workspace = await prisma.workspace.update({
            where: { id: found.id },
            data: {
              telegramMemberChatIds: existingIds.join(', '),
              telegramBotActive: true,
            },
          });
        }
      }

      const token = workspace?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        if (workspace && isOwner) {
          await sendTelegramMessage(
            token,
            chatId,
            `<b>Welcome, Owner of ${workspace.name}!</b>\n\n` +
              `Your Telegram Chat ID: <code>${chatId}</code>\n` +
              `Role: <b>Executive Owner (Full Access & Alerts)</b>\n\n` +
              `<b>Available actions:</b>\n` +
              `• Snap receipt/invoice photos to send directly for review\n` +
              `• Ask financial questions (e.g. <i>"What's our burn rate?"</i>, <i>"/summary"</i>, <i>"/runway"</i>)\n` +
              `• Receive real-time alerts whenever a receipt is added exceeding $${workspace.notifyHighSpendMin}\n\n` +
              `Type /help anytime to see available commands.`
          );
        } else if (workspace && isMember) {
          await sendTelegramMessage(
            token,
            chatId,
            `<b>Welcome to ${workspace.name}!</b>\n\n` +
              `Your Telegram Chat ID: <code>${chatId}</code>\n` +
              `Role: <b>Team Member (Submissions Only)</b>\n\n` +
              `<b>How to submit an expense or income:</b>\n` +
              `Simply snap and send a clear photo of any receipt, bill, or invoice.\n` +
              `You will be prompted to select <b>Spending (Expense)</b> or <b>Income</b>, and it will be sent to the Approvals tab for owner review!`
          );
        } else {
          await sendTelegramMessage(
            token,
            chatId,
            `<b>Welcome to Komnottra Bot!</b>\n\n` +
              `Your Telegram Chat ID is:\n<code>${chatId}</code>\n\n` +
              `<i>Share this ID with your Workspace Owner. They can add you in <b>Settings -> Telegram Bot & Chatbot</b> as an <b>Owner</b> (full access) or as a <b>Team Member</b> (receipt submission only).</i>`
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (!workspace) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await sendTelegramMessage(
          token,
          chatId,
          `<b>Komnottra Bot</b>\n\n` +
            `This chat is not connected to a workspace yet.\n` +
            `Your Telegram Chat ID is: <code>${chatId}</code>\n\n` +
            `<i>Share this ID with your Workspace Owner to link your account.</i>`
        );
      }
      return NextResponse.json({ ok: true });
    }

    const token = workspace.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: true });
    }

    // 3. Handle Receipt Photo Upload directly in Telegram
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      await sendTelegramMessage(token, chatId, `<i>Scanning receipt with Gemini Vision...</i>`);

      const photoObj = message.photo[message.photo.length - 1]; // Highest resolution
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photoObj.file_id}`);
      const fileData = await fileRes.json();

      if (fileData.ok && fileData.result?.file_path) {
        const filePath = fileData.result.file_path;
        const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const base64 = buffer.toString('base64');

        // Save local file copy safely
        let imageUrl = '';
        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const fileName = `tg_${Date.now()}_receipt.jpg`;
          const localPath = path.join(uploadsDir, fileName);
          fs.writeFileSync(localPath, buffer);
          imageUrl = `/uploads/${fileName}`;
        } catch (fsErr) {
          console.warn('Failed to save receipt image locally:', fsErr);
        }

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
          // Find or fallback to owner / first user in workspace
          let claimantUser = await prisma.user.findFirst({
            where: { workspaceId: workspace.id, role: 'OWNER' },
          });
          if (!claimantUser) {
            claimantUser = await prisma.user.findFirst({
              where: { workspaceId: workspace.id },
            });
          }

          if (claimantUser) {
            const activeRate = workspace.exchangeRate || 4100;
            const isUsd = parsed.currency === 'USD';
            let totalBaseEquiv = 0;
            if (workspace.baseCurrency === 'USD') {
              totalBaseEquiv = isUsd ? parsed.total : parsed.total / activeRate;
            } else {
              totalBaseEquiv = isUsd ? parsed.total * activeRate : parsed.total;
            }

            // Create record with status PENDING so it goes into Owner Review
            const receipt = await prisma.receipt.create({
              data: {
                workspaceId: workspace.id,
                claimantId: claimantUser.id,
                submittedBy: isOwner ? `Owner: ${telegramSenderName}` : `Staff: ${telegramSenderName}`,
                date: parsed.date,
                receiptNo: parsed.receiptNo || `TG-${Date.now().toString().slice(-4)}`,
                payee: parsed.vendor || 'Merchant',
                vendorTin: parsed.vendorTin || '—',
                description: parsed.note || `Telegram receipt by ${telegramSenderName}`,
                department: parsed.department || 'General',
                expenseCode: parsed.category || 'General',
                paymentMethod: 'Telegram Upload',
                currency: parsed.currency,
                rate: activeRate,
                amountExclVat: parsed.amountExclVat,
                vat: parsed.vat,
                total: parsed.total,
                totalBaseEquiv,
                status: 'PENDING', // Goes to Review Queue!
                imageUrl,
                rawExtractedJson: JSON.stringify(parsed),
              },
            });

            // Reply with receipt details and interactive inline buttons for Expense vs Income
            await sendTelegramMessage(
              token,
              chatId,
              `<b>Receipt Parsed Successfully</b>\n\n` +
                `• <b>Merchant / Payer:</b> ${parsed.vendor}\n` +
                `• <b>Amount:</b> ${parsed.total} ${parsed.currency}\n` +
                `• <b>Date:</b> ${parsed.date}\n` +
                `• <b>Category:</b> ${parsed.category}\n` +
                `• <b>TIN:</b> ${parsed.vendorTin || '—'}\n` +
                `• <b>Submitted By:</b> ${telegramSenderName}\n\n` +
                `<b>Please choose: Is this a Spending (Expense) or Incoming (Revenue)?</b>`,
              {
                replyMarkup: {
                  inline_keyboard: [
                    [
                      { text: 'Expense / Spending', callback_data: `type_exp:${receipt.id}` },
                      { text: 'Income / Inflow', callback_data: `type_inc:${receipt.id}` },
                    ],
                  ],
                },
              }
            );
            return NextResponse.json({ ok: true });
          }
        }
      }

      await sendTelegramMessage(
        token,
        chatId,
        `Could not clearly read the receipt details. Please ensure the image is bright and unblurred.`
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Handle Text Commands & AI Natural Q&A
    // Enforce Staff Member restriction: Members can ONLY submit photos and click inline buttons!
    if (!isOwner && isMember) {
      if (text === '/help') {
        await sendTelegramMessage(
          token,
          chatId,
          `<b>Komnottra Team Member Help:</b>\n\n` +
            `• <b>Send any receipt or invoice photo</b> to submit for approval.\n` +
            `• Tap <b>Expense</b> or <b>Income</b> on the buttons below your upload.\n\n` +
            `<i>Note: Company financial summaries and chatbot queries are restricted to Workspace Owners.</i>`
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(
        token,
        chatId,
        `<b>Staff Access Only</b>\n\n` +
          `Your Telegram ID is authorized as a <b>Team Member</b> (receipt & invoice submission only).\n\n` +
          `Company financials, runway projections, and chatbot queries are reserved for Workspace Owners.\n\n` +
          `<i>To submit an expense, simply snap and send a photo of your receipt!</i>`
      );
      return NextResponse.json({ ok: true });
    }
    if (text === '/help') {
      await sendTelegramMessage(
        token,
        chatId,
        `<b>Komnottra Bot Commands:</b>\n\n` +
          `• <b>/summary</b> - Get month-to-date cashflow summary\n` +
          `• <b>/runway</b> - Check cash runway & monthly burn\n` +
          `• <b>/forecast</b> - 30-day predictive expense projection\n` +
          `• <b>Photo</b> - Snap a receipt photo to log directly\n\n` +
          `<i>Or just ask me any question naturally, like:</i>\n` +
          `• <i>"How much did we spend on utilities this month?"</i>\n` +
          `• <i>"What's our net profit in USD and Riel?"</i>\n` +
          `• <i>"Who submitted the largest claim recently?"</i>`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/summary') {
      const reply = await askWorkspaceAgent(workspace.id, "Give me an executive summary of our month-to-date spend, income, and net position.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (text === '/runway') {
      const reply = await askWorkspaceAgent(workspace.id, "Calculate our cash runway and monthly burn rate in detail with recommendations.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (text === '/forecast') {
      const reply = await askWorkspaceAgent(workspace.id, "Predict our next 30 days expense liability based on historical burn.");
      await sendTelegramMessage(token, chatId, reply);
      return NextResponse.json({ ok: true });
    }

    // 5. General Natural Language Q&A with Chatbot
    const aiAnswer = await askWorkspaceAgent(workspace.id, text);
    await sendTelegramMessage(token, chatId, aiAnswer);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error handling Telegram webhook:', error);
    // Always return 200 OK to Telegram to prevent retry loops
    return NextResponse.json({ ok: true });
  }
}
