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