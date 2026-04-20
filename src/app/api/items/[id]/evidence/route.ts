import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evidenceSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = evidenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.remediationItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (item.status === 'closed') {
    return NextResponse.json({ error: 'Cannot add evidence to closed items' }, { status: 400 });
  }

  const evidence = await prisma.evidenceRecord.create({
    data: {
      remediationItemId: id,
      evidenceType: parsed.data.evidenceType,
      sourceSystem: parsed.data.sourceSystem,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      description: parsed.data.description,
      periodCoveredStart: parsed.data.periodCoveredStart ? new Date(parsed.data.periodCoveredStart) : null,
      periodCoveredEnd: parsed.data.periodCoveredEnd ? new Date(parsed.data.periodCoveredEnd) : null,
      uploadedById: parsed.data.uploadedById,
    },
  });

  return NextResponse.json(evidence, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evidence = await prisma.evidenceRecord.findMany({
    where: { remediationItemId: id },
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { displayName: true, email: true } } },
  });
  return NextResponse.json(evidence);
}
