import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const members = await prisma.user.findMany({
      where: { workspaceId: session.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId: session.workspaceId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { inviteCode: true, name: true, ownerId: true },
    });

    return NextResponse.json({
      success: true,
      members,
      invites,
      inviteCode: workspace?.inviteCode,
      workspaceName: workspace?.name,
    });
  } catch (err: any) {
    console.error('Error fetching members:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.workspaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Only workspace owners can remove members' }, { status: 403 });
    }

    const { memberId, inviteId } = await req.json();

    if (inviteId) {
      await prisma.workspaceInvite.delete({
        where: { id: inviteId },
      });
      return NextResponse.json({ success: true, message: 'Invite cancelled' });
    }

    if (memberId) {
      if (memberId === session.userId) {
        return NextResponse.json({ success: false, error: 'Cannot remove yourself as owner' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: memberId },
        data: { workspaceId: null, role: 'MEMBER' },
      });
      return NextResponse.json({ success: true, message: 'Member removed from workspace' });
    }

    return NextResponse.json({ success: false, error: 'Missing memberId or inviteId' }, { status: 400 });
  } catch (err: any) {
    console.error('Error removing member:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
