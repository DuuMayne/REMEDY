import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { slaPolicySchema } from '@/lib/validation';

export async function GET() {
  const policies = await prisma.slaPolicy.findMany({
    orderBy: [{ severity: 'asc' }, { findingType: 'asc' }],
  });
  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = slaPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const policy = await prisma.slaPolicy.upsert({
    where: {
      findingType_severity: {
        findingType: parsed.data.findingType,
        severity: parsed.data.severity,
      },
    },
    update: {
      dueInDays: parsed.data.dueInDays,
      escalationAfterDays: parsed.data.escalationAfterDays,
    },
    create: parsed.data,
  });

  return NextResponse.json(policy);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.slaPolicy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
