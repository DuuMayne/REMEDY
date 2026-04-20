import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ingestSchema } from '@/lib/validation';
import { calculateDueDate } from '@/lib/sla';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Idempotency: check if externalKey already exists
  const existing = await prisma.remediationItem.findUnique({
    where: { externalKey: data.externalKey },
  });

  if (existing) {
    return NextResponse.json({
      message: 'Item already exists',
      id: existing.id,
      status: existing.status,
    }, { status: 200 });
  }

  // Calculate due date from SLA if not provided
  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : await calculateDueDate(data.findingType, data.severity);

  const item = await prisma.remediationItem.create({
    data: {
      externalKey: data.externalKey,
      prismScenarioId: data.prismScenarioId,
      prismFindingId: data.prismFindingId,
      title: data.title,
      description: data.description,
      findingType: data.findingType,
      severity: data.severity,
      sourceSystem: data.sourceSystem,
      applicationName: data.applicationName,
      entitlementName: data.entitlementName,
      userId: data.userId,
      userEmail: data.userEmail,
      userDisplayName: data.userDisplayName,
      ownerId: data.ownerId,
      escalationOwnerId: data.escalationOwnerId,
      dueDate,
      status: 'open',
    },
  });

  return NextResponse.json({ id: item.id, status: item.status, dueDate: item.dueDate }, { status: 201 });
}
