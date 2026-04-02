import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.FRONTEND_URL || 'https://nirapod-kontho-frontend.vercel.app',
    process.env.CLIENT_URL || 'https://nirapod-kontho-frontend.vercel.app',
    process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    'https://nirapod-kontho-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
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