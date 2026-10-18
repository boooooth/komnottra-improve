import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const origin = process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL.replace(/\/$/, '') : `${proto}://${host}`;
  const redirectUri = `${origin}/api/auth/callback/google`;

  if (!clientId || clientId.trim() === '') {
    // If not yet configured in .env, redirect with parameter to show setup prompt
    return NextResponse.redirect(`${origin}/?error=google_credentials_missing`);
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
