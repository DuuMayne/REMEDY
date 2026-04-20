import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const status = params.get('status');
  const severity = params.get('severity');
  const ownerId = params.get('ownerId');
  const applicationName = params.get('applicationName');
  const overdueOnly = params.get('overdue') === 'true';
  const page = parseInt(params.get('page') || '1');
  const limit = parseInt(params.get('limit') || '50');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (ownerId) where.ownerId = ownerId;
  if (applicationName) where.applicationName = applicationName;
  if (overdueOnly) {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ['verified', 'closed'] };
  }

  const [items, total] = await Promise.all([
    prisma.remediationItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        escalationOwner: { select: { id: true, displayName: true, email: true } },
      },
    }),
    prisma.remediationItem.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
