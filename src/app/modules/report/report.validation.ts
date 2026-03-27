import { z } from 'zod';

export const createReportSchema = z.object({
  type: z.enum([
    'HARASSMENT',
    'DOMESTIC_VIOLENCE',
    'STALKING',
    'CORRUPTION',
    'THREAT',
  ]),
  description: z.string().min(10, 'Description too short'),
  location: z.string().min(3),
  isAnonymous: z.coerce.boolean().optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
});

export const assignReportSchema = z.object({
  ngoId: z.string().min(1, 'ngoId is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});