import { z } from 'zod';

export const createNgoSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(5),
});