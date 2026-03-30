import { z } from 'zod';

export const createNgoWithAdminSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(5),
  supportedReportTypes: z
    .array(
      z.enum(['HARASSMENT', 'DOMESTIC_VIOLENCE', 'STALKING', 'CORRUPTION', 'THREAT'])
    )
    .optional(),
  coverageAreas: z.array(z.string().min(2)).optional(),
  maxActiveCases: z.coerce.number().int().min(1).max(500).optional(),
  priorityEscalationHours: z.coerce.number().int().min(1).max(168).optional(),
  admin: z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});