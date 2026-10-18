import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, demoUser } = await req.json();

    let user;

    if (demoUser) {
      // Fast 1-click login for presentations/judges without typing passwords
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: demoUser },
            { role: demoUser.toUpperCase() },
          ],
        },
        include: { workspace: true },
      });
    } else {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
      }

      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { workspace: true },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }

      // Check password if set
      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const sessionPayload: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: (user.role as 'OWNER' | 'MEMBER') || 'MEMBER',
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name || undefined,
      department: user.department || undefined,
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
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal login error' }, { status: 500 });
  }
}
