import type { CookieOptions, Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export const oauthCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  path: '/',
  ...(isProduction ? { partitioned: true, priority: 'high' as const } : {}),
};

export const persistentOauthCookieOptions: CookieOptions = {
  ...oauthCookieOptions,
  maxAge: sessionDurationMs,
};

const managedCookieNames = [
  'auth-token',
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

const parseCookies = (cookieHeader: string) =>
  cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [rawName, ...rawValueParts] = cookie.trim().split('=');

    if (!rawName || rawValueParts.length === 0) {
      return acc;
    }

    const value = rawValueParts.join('=');

    try {
      acc[rawName] = decodeURIComponent(value);
    } catch {
      acc[rawName] = value;
    }

    return acc;
  }, {});

export const getLegacySessionToken = (req: Request) => {
  const cookies = parseCookies(req.headers.cookie || '');

  return cookies['auth-token'] || null;
};

export const setLegacySessionCookie = (res: Response, token: string) => {
  res.cookie('auth-token', token, persistentOauthCookieOptions);
};

export const clearManagedSessionCookies = (res: Response) => {
  for (const cookieName of managedCookieNames) {
    res.clearCookie(cookieName, oauthCookieOptions);
  }
};

export const applyNoStoreHeaders = (res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
};
