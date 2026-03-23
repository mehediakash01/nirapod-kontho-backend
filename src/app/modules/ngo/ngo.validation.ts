import { z } from 'zod';

export const createNgoWithAdminSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(5),
    admin: z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
    }),
});