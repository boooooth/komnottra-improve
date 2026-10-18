import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, createSessionToken, COOKIE_NAME, UserSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { email, role, inviteCode } = await req.json();

    // Joining via Invite Code
    if (inviteCode) {
      const workspace = await prisma.workspace.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
      });
      if (!workspace) {
        return NextResponse.json({ success: false, error: `Invalid invite code: ${inviteCode}` }, { status: 404 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.userId },
        data: {
          workspaceId: workspace.id,
          role: 'MEMBER',
        },
      });

      // Refresh session token with new workspace
      const updatedSession: UserSession = {
        ...session,
        role: 'MEMBER',
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      };
      const token = await createSessionToken(updatedSession);

      const response = NextResponse.json({
        success: true,
        message: `Successfully joined ${workspace.name}!`,
        workspace,
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
    }

    // For inviting another user by Email: Must have active workspace
    if (!session.workspaceId) {
      return NextResponse.json({ success: false, error: 'You must belong to a workspace to invite members' }, { status: 400 });
    }

    // Inviting another user by Email
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required to invite a user' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Check if target user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    const inviteRole = role === 'OWNER' ? 'OWNER' : 'MEMBER';

    // Check existing invite
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: session.workspaceId,
        email: targetEmail,
      },
    });

    if (existingInvite) {
      return NextResponse.json({
        success: true,
        message: `An invitation is already active for ${targetEmail}.`,
      });
    }

    // Create WorkspaceInvite
    await prisma.workspaceInvite.create({
      data: {
        workspaceId: session.workspaceId,
        email: targetEmail,
        role: inviteRole,
        status: existingUser ? 'ACCEPTED' : 'PENDING',
      },
    });

    // If user already exists and isn't locked in another workspace, link them directly
    if (existingUser && (!existingUser.workspaceId || existingUser.workspaceId === session.workspaceId)) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          workspaceId: session.workspaceId,
          role: inviteRole,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetEmail} invited to ${session.workspaceName || 'workspace'} as ${inviteRole}!`,
    });
  } catch (err: any) {
    console.error('Error inviting user:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
