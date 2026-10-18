import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { workspace: true },
    });

    if (!user) {
      const res = NextResponse.json({ success: true, user: null });
      res.cookies.delete('komnottra_session');
      return res;
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
        department: user.department || null,
        workspaceId: user.workspaceId || null,
        workspaceName: user.workspace?.name || null,
        inviteCode: user.workspace?.inviteCode || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
