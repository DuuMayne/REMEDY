import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', displayName: 'Security Admin', role: 'admin' },
  });

  const owner1 = await prisma.user.upsert({
    where: { email: 'jsmith@example.com' },
    update: {},
    create: { email: 'jsmith@example.com', displayName: 'John Smith', role: 'owner' },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'mjones@example.com' },
    update: {},
    create: { email: 'mjones@example.com', displayName: 'Maria Jones', role: 'owner' },
  });

  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@example.com' },
    update: {},
    create: { email: 'verifier@example.com', displayName: 'Alex Verifier', role: 'verifier' },
  });

  // Create SLA policies
  await prisma.slaPolicy.upsert({
    where: { findingType_severity: { findingType: 'excessive_privilege', severity: 'critical' } },
    update: {},
    create: { findingType: 'excessive_privilege', severity: 'critical', dueInDays: 3, escalationAfterDays: 1 },
  });
  await prisma.slaPolicy.upsert({
    where: { findingType_severity: { findingType: 'orphaned_account', severity: 'high' } },
    update: {},
    create: { findingType: 'orphaned_account', severity: 'high', dueInDays: 7, escalationAfterDays: 3 },
  });
  await prisma.slaPolicy.upsert({
    where: { findingType_severity: { findingType: 'stale_access', severity: 'medium' } },
    update: {},
    create: { findingType: 'stale_access', severity: 'medium', dueInDays: 30, escalationAfterDays: 14 },
  });
  await prisma.slaPolicy.upsert({
    where: { findingType_severity: { findingType: 'mfa_disabled', severity: 'high' } },
    update: {},
    create: { findingType: 'mfa_disabled', severity: 'high', dueInDays: 7, escalationAfterDays: 3 },
  });

  // Create demo remediation items
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // 1. Open item
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-001' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-001',
      prismScenarioId: 'SCN-0001',
      title: 'Revoke admin access for terminated contractor',
      description: 'Contractor J. Doe retained Okta admin access 30 days after termination. Access should be revoked immediately.',
      findingType: 'orphaned_account',
      severity: 'high',
      applicationName: 'Okta',
      entitlementName: 'Super Admin',
      userEmail: 'jdoe.contractor@example.com',
      userDisplayName: 'J. Doe (Contractor)',
      ownerId: owner1.id,
      escalationOwnerId: admin.id,
      dueDate: daysFromNow(5),
      status: 'open',
      createdAt: daysAgo(2),
    },
  });

  // 2. Overdue item
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-002' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-002',
      prismScenarioId: 'SCN-0001',
      title: 'Disable MFA-exempt service account in CrowdStrike',
      description: 'Service account svc-deploy has MFA exemption and broad read access. Should be scoped down or have MFA enforced.',
      findingType: 'mfa_disabled',
      severity: 'critical',
      applicationName: 'CrowdStrike',
      entitlementName: 'Falcon Administrator',
      userEmail: 'svc-deploy@example.com',
      userDisplayName: 'svc-deploy',
      ownerId: owner2.id,
      escalationOwnerId: admin.id,
      dueDate: daysAgo(2),
      status: 'in_progress',
      createdAt: daysAgo(10),
    },
  });

  // 3. Blocked item
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-003' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-003',
      prismScenarioId: 'SCN-0002',
      title: 'Remove excessive S3 bucket permissions for analytics role',
      description: 'Analytics team role has write access to production S3 buckets. Should be read-only.',
      findingType: 'excessive_privilege',
      severity: 'medium',
      applicationName: 'AWS',
      entitlementName: 'Policy: S3FullAccess',
      userEmail: 'analytics-team@example.com',
      userDisplayName: 'Analytics Team Role',
      ownerId: owner1.id,
      dueDate: daysFromNow(20),
      status: 'blocked',
      createdAt: daysAgo(15),
    },
  });

  // 4. Resolved (pending verification)
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-004' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-004',
      title: 'Revoke GitHub org access for departed employee',
      description: 'Former employee B. Wilson still has GitHub org member access 45 days after departure.',
      findingType: 'orphaned_account',
      severity: 'high',
      applicationName: 'GitHub',
      entitlementName: 'Organization Member',
      userEmail: 'bwilson@example.com',
      userDisplayName: 'B. Wilson',
      ownerId: owner2.id,
      dueDate: daysAgo(1),
      status: 'resolved',
      resolutionType: 'revoked',
      resolutionNotes: 'Removed from GitHub org. Verified account no longer appears in member list.',
      resolvedAt: daysAgo(1),
      createdAt: daysAgo(8),
    },
  });

  // 5. Verified item
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-005' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-005',
      title: 'Document false positive: shared mailbox flagged as stale',
      description: 'Shared mailbox compliance@ was flagged as stale access but is actively used by the compliance team.',
      findingType: 'stale_access',
      severity: 'low',
      applicationName: 'Google Workspace',
      entitlementName: 'Shared Mailbox Access',
      userEmail: 'compliance@example.com',
      userDisplayName: 'Compliance Shared Mailbox',
      ownerId: owner1.id,
      dueDate: daysFromNow(60),
      status: 'verified',
      resolutionType: 'false_positive',
      resolutionNotes: 'This is a shared functional mailbox, not a personal account. Access is appropriate.',
      resolvedAt: daysAgo(3),
      verifiedAt: daysAgo(1),
      createdAt: daysAgo(12),
    },
  });

  // 6. Closed item
  await prisma.remediationItem.upsert({
    where: { externalKey: 'PRISM-DEMO-006' },
    update: {},
    create: {
      externalKey: 'PRISM-DEMO-006',
      title: 'Reduce Snowflake ACCOUNTADMIN grants to least privilege',
      description: 'Three users had ACCOUNTADMIN when they only needed SYSADMIN for their job functions.',
      findingType: 'excessive_privilege',
      severity: 'high',
      applicationName: 'Snowflake',
      entitlementName: 'ACCOUNTADMIN',
      userEmail: 'multiple',
      userDisplayName: '3 users',
      ownerId: owner2.id,
      dueDate: daysAgo(5),
      status: 'closed',
      resolutionType: 'modified',
      resolutionNotes: 'Downgraded all 3 users from ACCOUNTADMIN to SYSADMIN. Verified via SHOW GRANTS.',
      resolvedAt: daysAgo(7),
      verifiedAt: daysAgo(5),
      closedAt: daysAgo(5),
      createdAt: daysAgo(20),
    },
  });

  console.log('Seed complete: 4 users, 4 SLA policies, 6 demo remediation items');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
