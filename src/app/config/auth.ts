import { betterAuth } from 'better-auth';

import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5000',
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
});