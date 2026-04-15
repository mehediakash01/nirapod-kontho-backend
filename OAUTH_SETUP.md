# OAuth Setup Guide

## Problem Summary
After OAuth login, users were stuck on the login page instead of redirecting to the dashboard. The issue was due to:
1. Frontend calling the wrong session endpoint
2. OAuth app naming not reflecting the frontend domain

## Environment Variables Required

### Backend (.env)
```env
# Frontend Configuration - CRITICAL for OAuth redirects
FRONTEND_URL=https://nirapod-kontho-frontend.vercel.app
CLIENT_URL=https://nirapod-kontho-frontend.vercel.app

# Better Auth base URL (backend domain)
BETTER_AUTH_URL=https://your-backend-domain.vercel.app

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Auth Secret (use a long random string)
BETTER_AUTH_SECRET=your-very-long-random-secret-string
```

### Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**

2. **Create/Select OAuth 2.0 Credentials**
   - Application Type: **Web Application**
   - Application Name: **Nirapod Kontho Frontend** (NOT backend)
   - This name shows to users during login consent screen

3. **Authorized redirect URIs** - Must include BOTH:
   ```
   https://<backend-domain>.vercel.app/api/oauth/callback/google
   http://localhost:5000/api/oauth/callback/google
   ```
   Replace `<backend-domain>` with your actual backend Vercel domain

4. **Copy credentials**
   - Client ID → `GOOGLE_CLIENT_ID` in backend `.env`
   - Client Secret → `GOOGLE_CLIENT_SECRET` in backend `.env`

## Frontend Flow

### Local Development
```env
# .env.local (or next.config.ts default)
NEXT_PUBLIC_API_URL=http://localhost:5000
API_PROXY_TARGET=http://localhost:5000
```

### Production (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app
API_PROXY_TARGET=https://your-backend-domain.vercel.app
```

## Verification Checklist

- [ ] Backend `FRONTEND_URL` env var set to frontend domain (with https)
- [ ] Google Console OAuth app name is "Nirapod Kontho Frontend"
- [ ] Google Console redirect URI includes backend domain callback URL
- [ ] Backend `/api/oauth/callback/google` endpoint returns 200 OK
- [ ] Backend `/api/oauth/session` endpoint validates `auth-token` cookie
- [ ] Frontend AuthContext tries `/oauth/session` endpoint first
- [ ] Frontend LoginForm detects `oauth_success=true` parameter
- [ ] CORS includes frontend domain in `trustedOrigins`

## Session Flow

1. **User clicks "Sign in with Google"**
   - Frontend calls `GET /api/oauth/google`
   - Returns Google authorization URL with backend callback

2. **User authorizes in Google**
   - Google redirects to `https://<backend>/api/oauth/callback/google?code=...`
   - Backend exchanges code for Google tokens
   - Backend creates user + session in database
   - Backend sets `auth-token` cookie (httpOnly, secure)
   - Backend redirects to `https://<frontend>/dashboard?oauth_success=true`

3. **Frontend detects OAuth success**
   - LoginForm checks for `oauth_success=true`
   - Calls `refetchSession()` which:
     - Tries `GET /api/oauth/session` (with auth-token cookie)
     - If that fails, tries `GET /api/auth/session` (for better-auth)
   - On success, redirects to `/dashboard`

4. **Dashboard loads with authenticated session**
   - AuthContext fetches session on mount
   - User profile and role available throughout app

## Troubleshooting

### "You're signing back in to nirapod-kontho-backend.vercel.app"
- OAuth app name in Google Console is wrong
- Change to "Nirapod Kontho Frontend" (or your frontend app name)

### User stuck on login page after OAuth
- Check browser DevTools Network tab:
  - OAuth callback request should redirect with 302
  - Session endpoint should return user data
- Check backend logs for session creation errors
- Verify `auth-token` cookie is set after callback

### CORS errors
- Frontend domain must be in backend `trustedOrigins` array
- Include both http and https versions if testing locally

### Session not found errors
- `FRONTEND_URL` env var pointing to wrong domain
- Auth-token cookie not being sent with requests
- Try deleting cookies and logging in again
