import { Router, Request, Response } from 'express';
import { auth } from '../../config/auth';
import { prisma } from '../../config/prisma';
import {
  applyNoStoreHeaders,
  clearManagedSessionCookies,
  getLegacySessionToken,
  setLegacySessionCookie,
} from './oauth.cookies';
import { consumeOauthHandoff } from './oauth.handoff';

const router = Router();

const buildForwardedHeaders = (req: Request) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
      continue;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  return headers;
};

const resolveBetterAuthSession = async (req: Request, res: Response) => {
  const sessionResult = await (auth.api.getSession as any)({
    method: 'GET',
    headers: buildForwardedHeaders(req),
    query: req.query as Record<string, string>,
    asResponse: false,
    returnHeaders: true,
  } as any).catch(() => null);

  if (!sessionResult?.response?.user) {
    return null;
  }

  const setCookie = sessionResult.headers?.getSetCookie?.() ?? [];
  if (setCookie.length > 0) {
    res.setHeader('Set-Cookie', setCookie);
  }

  sessionResult.headers?.forEach((value: string, key: string) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }

    res.setHeader(key, value);
  });

  return sessionResult.response;
};

const selectUserPayload = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  emailVerified: true,
} as const;

// Session endpoint to retrieve user from session token
router.get('/session', async (req: Request, res: Response) => {
  try {
    applyNoStoreHeaders(res);
    const handoffCode = typeof req.query.handoff === 'string' ? req.query.handoff : null;
    let legacyToken = getLegacySessionToken(req);

    if (!legacyToken && handoffCode) {
      legacyToken = await consumeOauthHandoff(handoffCode);

      if (legacyToken) {
        setLegacySessionCookie(res, legacyToken);
      }
    }

    const betterAuthSession = await resolveBetterAuthSession(req, res);

    if (betterAuthSession?.user?.id) {
      const session = (betterAuthSession as any).session || betterAuthSession;
      const fullUser = await prisma.user.findUnique({
        where: { id: betterAuthSession.user.id },
        select: selectUserPayload,
      });

      if (!fullUser) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (session?.expiresAt && new Date((session as any).expiresAt) < new Date()) {
        return res.status(401).json({ error: 'Session expired' });
      }

      return res.status(200).json({
        user: fullUser,
        session: {
          id: (session as any)?.id || '',
          expiresAt: (session as any)?.expiresAt,
        },
      });
    }

    if (!legacyToken) {
      return res.status(401).json({ error: 'No session token found' });
    }

    console.log('Looking up legacy OAuth session with token:', legacyToken.substring(0, 20) + '...');

    const session = await prisma.session.findUnique({
      where: { token: legacyToken },
      include: {
        user: {
          select: selectUserPayload,
        },
      },
    });

    if (!session) {
      console.log('Legacy OAuth session not found');
      return res.status(401).json({ error: 'Session not found' });
    }

    if (session.expiresAt < new Date()) {
      console.log('Legacy OAuth session expired');
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session expired' });
    }

    return res.status(200).json({
      user: session.user,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Session endpoint error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sign-out', async (req: Request, res: Response) => {
  try {
    const token = getLegacySessionToken(req);

    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }

    const betterAuthSession = await resolveBetterAuthSession(req, res);
    const betterAuthSessionId = (betterAuthSession as any)?.session?.id;

    if (betterAuthSessionId) {
      await prisma.session.deleteMany({ where: { id: betterAuthSessionId } });
    }

    clearManagedSessionCookies(res);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Sign-out endpoint error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
