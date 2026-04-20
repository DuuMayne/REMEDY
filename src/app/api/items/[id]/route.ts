import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await prisma.remediationItem.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true, email: true } },
      escalationOwner: { select: { id: true, displayName: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { displayName: true, email: true } } },
      },
      evidence: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { displayName: true, email: true } } },
      },
      verifications: {
        orderBy: { createdAt: 'desc' },
        include: { verifier: { select: { displayName: true, email: true } } },
      },
      assignmentHistory: {
        orderBy: { createdAt: 'desc' },
        include: {
          previousOwner: { select: { displayName: true } },
          newOwner: { select: { displayName: true } },
          changedBy: { select: { displayName: true } },
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}
