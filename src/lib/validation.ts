import { z } from 'zod';
import { SEVERITIES, FINDING_TYPES, RESOLUTION_TYPES, STATUSES } from './workflow';

export const ingestSchema = z.object({
  externalKey: z.string().min(1),
  prismScenarioId: z.string().optional(),
  prismFindingId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  findingType: z.enum(FINDING_TYPES as [string, ...string[]]),
  severity: z.enum(SEVERITIES as [string, ...string[]]),
  sourceSystem: z.string().optional(),
  applicationName: z.string().optional(),
  entitlementName: z.string().optional(),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  userDisplayName: z.string().optional(),
  ownerId: z.string().optional(),
  escalationOwnerId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(STATUSES as [string, ...string[]]),
  comment: z.string().optional(),
  resolutionType: z.enum(RESOLUTION_TYPES as [string, ...string[]]).optional(),
  resolutionNotes: z.string().optional(),
  actorId: z.string().min(1),
});

export const assignSchema = z.object({
  newOwnerId: z.string().min(1),
  reason: z.string().optional(),
  changedById: z.string().min(1),
});

export const evidenceSchema = z.object({
  evidenceType: z.enum(['screenshot', 'log_export', 'config_change', 'attestation', 'external_link']),
  sourceSystem: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  description: z.string().min(1),
  periodCoveredStart: z.string().datetime().optional(),
  periodCoveredEnd: z.string().datetime().optional(),
  uploadedById: z.string().min(1),
});

export const verifySchema = z.object({
  verifierId: z.string().min(1),
  outcome: z.enum(['accepted', 'rejected']),
  comment: z.string().optional(),
});

export const slaPolicySchema = z.object({
  findingType: z.enum(FINDING_TYPES as [string, ...string[]]),
  severity: z.enum(SEVERITIES as [string, ...string[]]),
  dueInDays: z.number().int().positive(),
  escalationAfterDays: z.number().int().positive(),
});
