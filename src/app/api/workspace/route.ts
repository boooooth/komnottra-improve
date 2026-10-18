import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NBC_EXCHANGE_RATE } from '@/lib/currency';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or no workspace active' }, { status: 401 });
    }

    let workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workspace: {
        ...workspace,
        departments: JSON.parse(workspace.departments || '[]'),
        expenseCodes: JSON.parse(workspace.expenseCodes || '[]'),
        projects: JSON.parse(workspace.projects || '[]'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or no workspace active' }, { status: 401 });
    }

    const body = await req.json();
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'No workspace found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.baseCurrency !== undefined) dataToUpdate.baseCurrency = body.baseCurrency;
    if (body.exchangeRate !== undefined) dataToUpdate.exchangeRate = parseFloat(body.exchangeRate);
    if (body.rateMode !== undefined) dataToUpdate.rateMode = body.rateMode;
    if (body.flagMissingTin !== undefined) dataToUpdate.flagMissingTin = Boolean(body.flagMissingTin);
    if (body.departments !== undefined) dataToUpdate.departments = JSON.stringify(body.departments);
    if (body.expenseCodes !== undefined) dataToUpdate.expenseCodes = JSON.stringify(body.expenseCodes);
    if (body.projects !== undefined) dataToUpdate.projects = JSON.stringify(body.projects);

    if (body.telegramBotToken !== undefined) dataToUpdate.telegramBotToken = body.telegramBotToken;
    if (body.telegramChatId !== undefined) dataToUpdate.telegramChatId = body.telegramChatId;
    if (body.telegramMemberChatIds !== undefined) dataToUpdate.telegramMemberChatIds = body.telegramMemberChatIds;
    if (body.telegramBotActive !== undefined) dataToUpdate.telegramBotActive = Boolean(body.telegramBotActive);
    if (body.telegramBotUsername !== undefined) dataToUpdate.telegramBotUsername = body.telegramBotUsername;

    if (body.notifyHighSpend !== undefined) dataToUpdate.notifyHighSpend = Boolean(body.notifyHighSpend);
    if (body.notifyHighSpendMin !== undefined) dataToUpdate.notifyHighSpendMin = parseFloat(body.notifyHighSpendMin) || 100.0;
    if (body.notifyDailyDigest !== undefined) dataToUpdate.notifyDailyDigest = Boolean(body.notifyDailyDigest);
    if (body.notifyNewIncome !== undefined) dataToUpdate.notifyNewIncome = Boolean(body.notifyNewIncome);
    if (body.notifyAnomalies !== undefined) dataToUpdate.notifyAnomalies = Boolean(body.notifyAnomalies);
    if (body.notifyBudgetAlert !== undefined) dataToUpdate.notifyBudgetAlert = Boolean(body.notifyBudgetAlert);
    if (body.monthlyBudgetUsd !== undefined) dataToUpdate.monthlyBudgetUsd = parseFloat(body.monthlyBudgetUsd) || 5000.0;

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: dataToUpdate,
    });

    // If updating columns visibility
    if (Array.isArray(body.columns)) {
      for (const col of body.columns) {
        if (col.id) {
          await prisma.workspaceColumn.update({
            where: { id: col.id },
            data: { isVisible: col.isVisible },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      workspace: updated,
    });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workspace' },
      { status: 500 }
    );
  }
}
