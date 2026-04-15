import { auth } from '../config/auth';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const authenticate = async (req: any, res: any, next: any) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    req.user = user;
    next();
    return;
  }

  const cookies = req.headers.cookie || '';
  const authTokenMatch = cookies.match(/auth-token=([^;]+)/);
  const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
  const token = authTokenMatch?.[1] || sessionTokenMatch?.[1];

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