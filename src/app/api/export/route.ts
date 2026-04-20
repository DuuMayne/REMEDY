import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') || 'json';

  const items = await prisma.remediationItem.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { displayName: true, email: true } },
      escalationOwner: { select: { displayName: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { displayName: true } } },
      },
      evidence: {
        orderBy: { createdAt: 'asc' },
        include: { uploadedBy: { select: { displayName: true } } },
      },
      verifications: {
        orderBy: { createdAt: 'asc' },
        include: { verifier: { select: { displayName: true } } },
      },
      assignmentHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          previousOwner: { select: { displayName: true } },
          newOwner: { select: { displayName: true } },
          changedBy: { select: { displayName: true } },
        },
      },
    },
  });

  if (format === 'csv') {
    const headers = [
      'ID', 'External Key', 'Title', 'Finding Type', 'Severity', 'Status',
      'Application', 'Entitlement', 'User Email', 'User Name',
      'Owner', 'Due Date', 'Created', 'Resolved', 'Verified', 'Closed',
      'Resolution Type', 'Resolution Notes', 'Evidence Count', 'Verification Outcome',
    ];

    const rows = items.map(item => [
      item.id,
      item.externalKey,
      item.title,
      item.findingType,
      item.severity,
      item.status,
      item.applicationName || '',
      item.entitlementName || '',
      item.userEmail || '',
      item.userDisplayName || '',
      item.owner?.displayName || 'Unassigned',
      item.dueDate?.toISOString() || '',
      item.createdAt.toISOString(),
      item.resolvedAt?.toISOString() || '',
      item.verifiedAt?.toISOString() || '',
      item.closedAt?.toISOString() || '',
      item.resolutionType || '',
      item.resolutionNotes || '',
      String(item.evidence.length),
      item.verifications[item.verifications.length - 1]?.outcome || '',
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="remedy_audit_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ exported_at: new Date().toISOString(), item_count: items.length, items });
}
