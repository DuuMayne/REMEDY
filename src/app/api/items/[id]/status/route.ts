import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { statusUpdateSchema } from '@/lib/validation';
import { validateTransition, Status } from '@/lib/workflow';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status: newStatus, comment, resolutionType, resolutionNotes, actorId } = parsed.data;

  const item = await prisma.remediationItem.findUnique({
    where: { id },
    include: { evidence: { select: { id: true } } },
  });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (item.status === 'closed') {
    return NextResponse.json({ error: 'Closed items are read-only' }, { status: 400 });
  }

  const validation = validateTransition(item.status as Status, newStatus as Status, {
    comment,
    hasEvidence: item.evidence.length > 0,
    resolutionType,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'resolved') {
    updateData.resolvedAt = now;
    if (resolutionType) updateData.resolutionType = resolutionType;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
  }
  if (newStatus === 'verified') updateData.verifiedAt = now;
  if (newStatus === 'closed') updateData.closedAt = now;

  await prisma.$transaction([
    prisma.remediationItem.update({ where: { id }, data: updateData }),
    prisma.statusHistory.create({
      data: {
        remediationItemId: id,
        actorId,
        fromStatus: item.status,
        toStatus: newStatus,
        comment,
      },
    }),
  ]);

  return NextResponse.json({ id, status: newStatus });
}
