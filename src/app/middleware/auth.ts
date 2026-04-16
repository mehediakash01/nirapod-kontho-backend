import { auth } from '../config/auth';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { getLegacySessionToken } from '../modules/oauth/oauth.cookies';

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

export const authenticate = async (req: any, res: any, next: any) => {
  const session = await auth.api
    .getSession({
      headers: buildForwardedHeaders(req),
    } as any)
    .catch(() => null);

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    req.user = user;
    next();
    return;
  }

  const token = getLegacySessionToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const legacySession = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!legacySession || legacySession.expiresAt < new Date()) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  req.user = legacySession.user;

  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    next();
  };
};
