import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { testTelegramConnection } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const token = body.token || body.botToken;
    const chatId = body.chatId;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Bot token is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    // Test connection
    const testResult = await testTelegramConnection(token.trim(), chatId?.trim() || '', workspace.name);

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: testResult.error,
        botUsername: testResult.botUsername,
      });
    }

    // Auto-register webhook with current domain if configured
    const host = req.headers.get('host') || 'komnottra.runbuddies.win';
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const webhookUrl = `${proto}://${host}/api/telegram/webhook`;

    try {
      await fetch(`https://api.telegram.org/bot${token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    } catch (whErr) {
      console.warn('Webhook auto-registration warning:', whErr);
    }

    // Update workspace settings
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        telegramBotToken: token.trim(),
        telegramChatId: chatId?.trim() || workspace.telegramChatId,
        telegramBotUsername: testResult.botUsername || workspace.telegramBotUsername,
        telegramBotActive: Boolean(chatId?.trim()),
      },
    });

    return NextResponse.json({
      success: true,
      botUsername: testResult.botUsername,
      message: 'Telegram Bot verified and connected successfully!',
      webhookUrl,
    });
  } catch (error: any) {
    console.error('Error testing Telegram connection:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
