import { z } from 'zod';

export const verifyReportSchema = z.object({
  reportId: z.string().min(1, 'reportId is required'),
  status: z.enum(['APPROVED', 'REJECTED']),
  feedback: z.string().optional(),
});