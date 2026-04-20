/**
 * Status transition rules and workflow logic for REMEDY.
 * This is the single source of truth for what transitions are allowed.
 */

export type Status = 'open' | 'in_progress' | 'blocked' | 'resolved' | 'verified' | 'closed';

export const STATUSES: Status[] = ['open', 'in_progress', 'blocked', 'resolved', 'verified', 'closed'];

const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  open: ['in_progress', 'blocked', 'resolved'],
  in_progress: ['blocked', 'resolved'],
  blocked: ['in_progress', 'resolved'],
  resolved: ['verified', 'in_progress', 'blocked'],
  verified: ['closed'],
  closed: [],
};

export function isValidTransition(from: Status, to: Status): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(currentStatus: Status): Status[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export type ResolutionType = 'revoked' | 'modified' | 'documented' | 'exception' | 'false_positive';

export const RESOLUTION_TYPES: ResolutionType[] = ['revoked', 'modified', 'documented', 'exception', 'false_positive'];

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

export type FindingType = 'excessive_privilege' | 'orphaned_account' | 'stale_access' | 'mfa_disabled' | 'unauthorized_access' | 'policy_violation' | 'other';

export const FINDING_TYPES: FindingType[] = [
  'excessive_privilege', 'orphaned_account', 'stale_access',
  'mfa_disabled', 'unauthorized_access', 'policy_violation', 'other',
];

export interface TransitionValidation {
  valid: boolean;
  error?: string;
}

export function validateTransition(
  fromStatus: Status,
  toStatus: Status,
  options?: { comment?: string; hasEvidence?: boolean; resolutionType?: string }
): TransitionValidation {
  if (!isValidTransition(fromStatus, toStatus)) {
    return { valid: false, error: `Cannot transition from "${fromStatus}" to "${toStatus}"` };
  }

  if (toStatus === 'blocked' && !options?.comment) {
    return { valid: false, error: 'A comment is required when marking an item as blocked' };
  }

  if (toStatus === 'resolved' && !options?.resolutionType) {
    return { valid: false, error: 'A resolution type is required when resolving an item' };
  }

  if (toStatus === 'resolved' && !options?.hasEvidence && options?.resolutionType !== 'false_positive') {
    return { valid: false, error: 'Evidence is required before resolving (unless resolution is false_positive)' };
  }

  return { valid: true };
}
