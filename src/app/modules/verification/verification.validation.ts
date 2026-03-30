import { z } from 'zod';

export const verifyReportSchema = z.object({
  reportId: z.string().min(1, 'reportId is required'),
  status: z.enum(['APPROVED', 'REJECTED']),
  feedback: z.string().optional(),
  rejectionReason: z
    .enum([
      'INSUFFICIENT_EVIDENCE',
      'INCONSISTENT_DETAILS',
      'DUPLICATE_REPORT',
      'OUT_OF_SCOPE',
      'POTENTIAL_SPAM',
      'OTHER',
    ])
    .optional(),
  checklist: z.array(z.string().min(1)).max(10).optional(),
});