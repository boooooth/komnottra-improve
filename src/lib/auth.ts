import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const DEFAULT_FALLBACK_SECRET = 'komnottra-cambodia-secure-jwt-secret-key-2026';
const rawSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && (!rawSecret || rawSecret === DEFAULT_FALLBACK_SECRET)) {
  console.warn(
    '⚠️ [SECURITY ALERT]: Running in production with default or unset JWT_SECRET! Please configure a cryptographically random JWT_SECRET in production.'
  );
}

const JWT_SECRET = new TextEncoder().encode(rawSecret || DEFAULT_FALLBACK_SECRET);

export const COOKIE_NAME = 'komnottra_session';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MEMBER';
  workspaceId: string | null;
  workspaceName?: string;
  department?: string | null;
}

export async function createSessionToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySessionToken(token);
    if (!session || !session.userId) return null;

    // RISK-01 Remediated: Active DB synchronization check ensures purged/revoked users are rejected immediately
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { workspace: true },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role as 'OWNER' | 'MEMBER',
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name,
      department: user.department,
    };
  } catch (error) {
    return null;
  }
}
