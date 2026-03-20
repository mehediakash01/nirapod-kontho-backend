import { betterAuth } from 'better-auth';

import { prismaAdapter } from '@better-auth/prisma-adapter';
import * as PrismaClientPackage from '@prisma/client';

const prisma = new (PrismaClientPackage as any).PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});