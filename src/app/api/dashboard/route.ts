import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const now = new Date();

  const [
    totalItems,
    byStatus,
    bySeverity,
    overdueCount,
    recentlyClosed,
    byOwner,
    byApplication,
  ] = await Promise.all([
    prisma.remediationItem.count(),
    prisma.remediationItem.groupBy({ by: ['status'], _count: true }),
    prisma.remediationItem.groupBy({
      by: ['severity'],
      where: { status: { notIn: ['verified', 'closed'] } },
      _count: true,
    }),
    prisma.remediationItem.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['verified', 'closed'] },
      },
    }),
    prisma.remediationItem.findMany({
      where: { status: 'closed' },
      orderBy: { closedAt: 'desc' },
      take: 10,
      select: { id: true, title: true, closedAt: true, resolvedAt: true, createdAt: true },
    }),
    prisma.remediationItem.groupBy({
      by: ['ownerId'],
      where: { status: { notIn: ['verified', 'closed'] } },
      _count: true,
    }),
    prisma.remediationItem.groupBy({
      by: ['applicationName'],
      where: { status: { notIn: ['verified', 'closed'] } },
      _count: true,
    }),
  ]);

  // Calculate mean time to remediate (from created to resolved, for resolved+ items)
  const resolvedItems = await prisma.remediationItem.findMany({
    where: { resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  });

  let meanTimeToRemediate = 0;
  if (resolvedItems.length > 0) {
    const totalDays = resolvedItems.reduce((sum, item) => {
      const days = (item.resolvedAt!.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    meanTimeToRemediate = Math.round(totalDays / resolvedItems.length * 10) / 10;
  }

  // Resolve owner names
  const ownerIds = byOwner.map(o => o.ownerId).filter(Boolean) as string[];
  const owners = ownerIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, displayName: true } })
    : [];
  const ownerMap = Object.fromEntries(owners.map(o => [o.id, o.displayName]));

  return NextResponse.json({
    totalItems,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    openBySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count])),
    overdueCount,
    meanTimeToRemediate,
    byOwner: byOwner.map(o => ({
      ownerId: o.ownerId,
      ownerName: ownerMap[o.ownerId || ''] || 'Unassigned',
      count: o._count,
    })),
    byApplication: byApplication.map(a => ({
      applicationName: a.applicationName || 'Unknown',
      count: a._count,
    })),
    recentlyClosed,
  });
}
