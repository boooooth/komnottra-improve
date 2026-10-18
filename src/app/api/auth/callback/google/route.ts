import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const origin = process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL.replace(/\/$/, '') : `${proto}://${host}`;
  const redirectUri = `${origin}/api/auth/callback/google`;
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?error=google_credentials_missing`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Failed to obtain Google token:', tokenData);
      return NextResponse.redirect(`${origin}/?error=token_exchange_failed`);
    }

    // 2. Fetch User Profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${origin}/?error=no_email_returned`);
    }

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || email.split('@')[0];
    const image = profile.picture || null;

    // 3. Find or create user in SQLite database
    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      // Check if there is an active invite for this email
      const pendingInvite = await prisma.workspaceInvite.findFirst({
        where: { email, status: 'PENDING' },
        include: { workspace: true },
      });

      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
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
      // If user exists but has no workspace, check if there's an invite
      if (!user.workspaceId) {
        const pendingInvite = await prisma.workspaceInvite.findFirst({
          where: { email, status: 'PENDING' },
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

    // 4. Create secure session token
    const sessionPayload: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || name,
      role: (user.role as 'OWNER' | 'MEMBER') || 'MEMBER',
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name || undefined,
      department: user.department || undefined,
    };

    const sessionToken = await createSessionToken(sessionPayload);

    // 5. Set HTTP-only Cookie and redirect to home
    const response = NextResponse.redirect(origin);
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/?error=oauth_error`);
  }
}
