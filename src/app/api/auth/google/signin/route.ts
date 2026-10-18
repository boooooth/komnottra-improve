import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, name, image } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const displayName = name || normalizedEmail.split('@')[0];

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { workspace: true },
    });

    if (!user) {
      // Check if there is a pending invite for this email
      const pendingInvite = await prisma.workspaceInvite.findFirst({
        where: { email: normalizedEmail, status: 'PENDING' },
        include: { workspace: true },
      });

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          image: image || null,
          role: pendingInvite ? pendingInvite.role : 'MEMBER',
          workspaceId: pendingInvite ? pendingInvite.workspaceId : null,
        },
        include: { workspace: true },
      });

      if (pendingInvite) {
        await prisma.workspaceInvite.update({
          where: { id: pendingInvite.id },
          data: { status: 'ACCEPTED' },
        });
      }
    } else {
      if (!user.workspaceId) {
        const pendingInvite = await prisma.workspaceInvite.findFirst({
          where: { email: normalizedEmail, status: 'PENDING' },
        });
        if (pendingInvite) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              workspaceId: pendingInvite.workspaceId,
              role: pendingInvite.role,
            },
            include: { workspace: true },
          });
          await prisma.workspaceInvite.update({
            where: { id: pendingInvite.id },
            data: { status: 'ACCEPTED' },
          });
        }
      }
    }

    const sessionPayload: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || displayName,
      role: (user.role as 'OWNER' | 'MEMBER') || 'MEMBER',
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name || undefined,
      department: user.department || 'Administration',
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
  } catch (err: any) {
    console.error('Google Sign In error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
