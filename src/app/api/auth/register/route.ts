import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';
import { NBC_EXCHANGE_RATE } from '@/lib/currency';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, inviteCode, companyName, department } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }

    let targetWorkspaceId: string | null = null;
    let targetWorkspaceName: string | undefined = undefined;
    const userRole: 'OWNER' | 'MEMBER' = role === 'OWNER' ? 'OWNER' : 'MEMBER';

    if (inviteCode) {
      // Find workspace by invite code
      const ws = await prisma.workspace.findUnique({
        where: { inviteCode: inviteCode.trim() },
      });
      if (!ws) {
        return NextResponse.json({ success: false, error: `Invalid Workspace Invite Code: ${inviteCode}` }, { status: 404 });
      }
      targetWorkspaceId = ws.id;
      targetWorkspaceName = ws.name;
    } else if (userRole === 'OWNER') {
      // Create new company workspace
      const newWs = await prisma.workspace.create({
        data: {
          name: companyName || `${name}'s Company`,
          baseCurrency: 'KHR',
          exchangeRate: NBC_EXCHANGE_RATE,
          rateMode: 'NBC_AUTO',
          flagMissingTin: true,
          inviteCode: `KOM-${Math.floor(1000 + Math.random() * 9000)}`,
          departments: JSON.stringify(['Administration', 'Sales', 'Engineering', 'Operations']),
          expenseCodes: JSON.stringify(['6100 Office', '6200 Meals', '6300 Transport', '6400 Utilities']),
          projects: JSON.stringify(['GA-2026 General admin', 'TRN-09 Staff training', 'BD-2026 Business dev.']),
        },
      });

      // Default Columns
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
            workspaceId: newWs.id,
            key: col.key,
            label: col.label,
            isVisible: col.isVisible,
            isRequired: col.isRequired,
            order: col.order,
          },
        });
      }

      targetWorkspaceId = newWs.id;
      targetWorkspaceName = newWs.name;
    } else {
      // Default to primary workspace
      const defaultWs = await prisma.workspace.findFirst();
      if (defaultWs) {
        targetWorkspaceId = defaultWs.id;
        targetWorkspaceName = defaultWs.name;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        department: department?.trim() || null,
        workspaceId: targetWorkspaceId,
      },
    });

    const sessionPayload: UserSession = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || newUser.email.split('@')[0],
      role: userRole,
      workspaceId: targetWorkspaceId,
      workspaceName: targetWorkspaceName,
      department: newUser.department || undefined,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
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
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Registration failed' }, { status: 500 });
  }
}
