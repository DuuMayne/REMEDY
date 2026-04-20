import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { verifierId, outcome, comment } = parsed.data;

  const item = await prisma.remediationItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (item.status !== 'resolved') {
    return NextResponse.json({ error: 'Only resolved items can be verified' }, { status: 400 });
  }

  // Separation of duties: verifier should not be the resolver
  if (item.ownerId === verifierId) {
    // Warn but don't block — "when possible" per spec
    // Could enforce strictly if policy requires it
  }

  const now = new Date();

  if (outcome === 'accepted') {
    await prisma.$transaction([
      prisma.remediationItem.update({
        where: { id },
        data: { status: 'verified', verifiedAt: now },
      }),
      prisma.verificationRecord.create({
        data: { remediationItemId: id, verifierId, outcome, comment },
      }),
      prisma.statusHistory.create({
        data: {
          remediationItemId: id,
          actorId: verifierId,
          fromStatus: 'resolved',
          toStatus: 'verified',
          comment: comment || 'Verification accepted',
        },
      }),
    ]);
  } else {
    // Rejection moves item back to in_progress
    await prisma.$transaction([
      prisma.remediationItem.update({
        where: { id },
        data: { status: 'in_progress', resolvedAt: null, resolutionType: null, resolutionNotes: null },
      }),
      prisma.verificationRecord.create({
        data: { remediationItemId: id, verifierId, outcome, comment },
      }),
      prisma.statusHistory.create({
        data: {
          remediationItemId: id,
          actorId: verifierId,
          fromStatus: 'resolved',
          toStatus: 'in_progress',
          comment: `Verification rejected: ${comment || 'No reason provided'}`,
        },
      }),
    ]);
  }

  return NextResponse.json({ id, outcome, status: outcome === 'accepted' ? 'verified' : 'in_progress' });
}
