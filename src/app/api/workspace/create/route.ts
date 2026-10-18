import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';
import { NBC_EXCHANGE_RATE } from '@/lib/currency';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { name, baseCurrency, exchangeRate, departments, categories, expenseCodes } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Workspace name is required' }, { status: 400 });
    }

    // Generate clean invite code like KOM-XXXX
    const inviteCode = `KOM-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalDepartments = Array.isArray(departments) && departments.length > 0
      ? departments.map((d: any) => String(d).trim()).filter(Boolean)
      : ['Administration', 'Sales & Marketing', 'Engineering & IT', 'Operations', 'Finance & Accounting'];

    const customCategories = categories || expenseCodes;
    const finalExpenseCodes = Array.isArray(customCategories) && customCategories.length > 0
      ? customCategories.map((c: any) => String(c).trim()).filter(Boolean)
      : ['Meals & Dining', 'Transport & Fuel', 'Office Supplies', 'Utilities & Internet', 'Lodging & Travel'];

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        ownerId: session.userId,
        baseCurrency: baseCurrency === 'USD' ? 'USD' : 'KHR',
        exchangeRate: parseFloat(exchangeRate) || NBC_EXCHANGE_RATE,
        rateMode: 'NBC_AUTO',
        flagMissingTin: true,
        inviteCode,
        departments: JSON.stringify(finalDepartments),
        expenseCodes: JSON.stringify(finalExpenseCodes),
        projects: JSON.stringify(['GA-2026 General admin', 'TRN-09 Staff training', 'BD-2026 Business dev.']),
      },
    });

    // Seed default columns for this workspace
    const defaultColumns = [
      { key: 'date', label: 'Date', isVisible: true, isRequired: true, order: 1 },
      { key: 'receiptNo', label: 'Receipt no.', isVisible: true, isRequired: true, order: 2 },
      { key: 'payee', label: 'Payee', isVisible: true, isRequired: true, order: 3 },
      { key: 'vendorTin', label: 'Vendor TIN', isVisible: true, isRequired: false, order: 4 },
      { key: 'description', label: 'Description', isVisible: true, isRequired: true, order: 5 },
      { key: 'claimant', label: 'Claimant', isVisible: true, isRequired: true, order: 6 },
      { key: 'department', label: 'Department', isVisible: true, isRequired: true, order: 7 },
      { key: 'project', label: 'Project / budget line', isVisible: true, isRequired: false, order: 8 },
      { key: 'expenseCode', label: 'Expense code', isVisible: true, isRequired: true, order: 9 },
      { key: 'paymentMethod', label: 'Payment method', isVisible: true, isRequired: false, order: 10 },
      { key: 'currency', label: 'Currency', isVisible: true, isRequired: true, order: 11 },
      { key: 'rate', label: 'Rate', isVisible: true, isRequired: true, order: 12 },
      { key: 'amountExclVat', label: 'Amount excl. VAT', isVisible: true, isRequired: true, order: 13 },
      { key: 'vat', label: 'VAT', isVisible: true, isRequired: true, order: 14 },
      { key: 'total', label: 'Total', isVisible: true, isRequired: true, order: 15 },
      { key: 'totalBaseEquiv', label: 'Total (KHR equiv.)', isVisible: true, isRequired: true, order: 16 },
      { key: 'status', label: 'Status', isVisible: true, isRequired: true, order: 17 },
      { key: 'approvedBy', label: 'Approved by', isVisible: true, isRequired: false, order: 18 },
    ];

    for (const col of defaultColumns) {
      await prisma.workspaceColumn.create({
        data: {
          workspaceId: newWorkspace.id,
          key: col.key,
          label: col.label,
          isVisible: col.isVisible,
          isRequired: col.isRequired,
          order: col.order,
        },
      });
    }

    // Attach user to workspace as OWNER
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        workspaceId: newWorkspace.id,
        role: 'OWNER',
      },
    });

    // Update session token with new workspace
    const updatedSession: UserSession = {
      ...session,
      role: 'OWNER',
      workspaceId: newWorkspace.id,
      workspaceName: newWorkspace.name,
    };
    const token = await createSessionToken(updatedSession);

    const response = NextResponse.json({
      success: true,
      workspace: newWorkspace,
      user: updatedSession,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Error creating workspace:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
