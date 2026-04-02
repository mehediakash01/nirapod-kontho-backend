import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from './prisma';

const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.replace(/^BETTER_AUTH_SECRET=/, '');

if (process.env.NODE_ENV === 'production' && !betterAuthSecret) {
  throw new Error('Missing BETTER_AUTH_SECRET in environment variables');
}

export const auth = betterAuth({
  secret: betterAuthSecret,
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
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },

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
