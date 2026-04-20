import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assignSchema } from '@/lib/validation';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { newOwnerId, reason, changedById } = parsed.data;

  const item = await prisma.remediationItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (item.status === 'closed') {
    return NextResponse.json({ error: 'Cannot reassign closed items' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.remediationItem.update({
      where: { id },
      data: { ownerId: newOwnerId },
    }),
    prisma.assignmentHistory.create({
      data: {
        remediationItemId: id,
        previousOwnerId: item.ownerId,
        newOwnerId,
        changedById,
        reason,
      },
    }),
  ]);

  return NextResponse.json({ id, ownerId: newOwnerId });
}
