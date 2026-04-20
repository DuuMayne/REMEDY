import { prisma } from './db';
import { addDays } from 'date-fns';

const DEFAULT_SLA: Record<string, Record<string, { dueInDays: number; escalationAfterDays: number }>> = {
  critical: { default: { dueInDays: 3, escalationAfterDays: 1 } },
  high: { default: { dueInDays: 7, escalationAfterDays: 3 } },
  medium: { default: { dueInDays: 30, escalationAfterDays: 14 } },
  low: { default: { dueInDays: 90, escalationAfterDays: 45 } },
};

export async function calculateDueDate(findingType: string, severity: string, createdAt: Date = new Date()): Promise<Date> {
  // Check for a specific SLA policy
  const policy = await prisma.slaPolicy.findUnique({
    where: { findingType_severity: { findingType, severity } },
  });

  if (policy) {
    return addDays(createdAt, policy.dueInDays);
  }

  // Fall back to severity-based default
  const severityDefault = DEFAULT_SLA[severity]?.default || DEFAULT_SLA.medium.default;
  return addDays(createdAt, severityDefault.dueInDays);
}

export async function getEscalationDays(findingType: string, severity: string): Promise<number> {
  const policy = await prisma.slaPolicy.findUnique({
    where: { findingType_severity: { findingType, severity } },
  });

  if (policy) return policy.escalationAfterDays;

  const severityDefault = DEFAULT_SLA[severity]?.default || DEFAULT_SLA.medium.default;
  return severityDefault.escalationAfterDays;
}

export function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date() > dueDate;
}
