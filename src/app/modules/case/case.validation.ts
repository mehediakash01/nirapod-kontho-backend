import { z } from 'zod';

export const updateCaseSchema = z.object({
 
    status: z.enum([
      'UNDER_REVIEW',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
    ]),

});