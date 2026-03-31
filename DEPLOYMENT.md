# Nirapod Kontho Backend - Vercel Deployment Guide

## Prerequisites

1. **Node.js**: v18+ installed
2. **PostgreSQL Database**: Neon PostgreSQL instance configured
3. **Vercel Account**: Free tier or higher
4. **Stripe Account**: Configured with API keys
5. **Google OAuth**: App configured for authentication

## Environment Variables for Production

Update the following environment variables in Vercel Project Settings → Environment Variables:

```env
# Database - REQUIRED
DATABASE_URL=postgresql://user:password@host/database?sslmode=verify-full&channel_binding=require

# Server Configuration
PORT=5000
NODE_ENV=production

# Better Auth - Set to your Vercel deployment URL
BETTER_AUTH_URL=https://your-backend-domain.vercel.app

# Frontend URLs
FRONTEND_URL=https://your-frontend-domain.com
CLIENT_URL=https://your-frontend-domain.com

# Stripe - Required for payment features
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Google OAuth - Required for Google sign-in
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Step-by-Step Deployment

### 1. Prepare the Repository

```bash
# Ensure all code is pushed to Git
git add .
git commit -m "Prepare for Vercel deployment"
git push

# Verify build works locally
npm run build
```

### 2. Connect to Vercel

**Option A: Using Vercel Web Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Select your Git repository
4. Import project settings

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
cd d:\project\nirapod-kontho-backend
vercel
```

### 3. Configure Project Settings

In Vercel Dashboard:

1. **Settings → General**
   - Framework: `Other` (since we're using Express)
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Settings → Environment Variables**
   - Add all variables from the section above
   - Ensure `NODE_ENV=production`

3. **Settings → Serverless Function Configuration**
   - Memory: 1024 MB (default)
   - Max Duration: 60 seconds (default)

### 4. Deploy

**Via Dashboard:**
- Push changes to your main branch
- Vercel automatically deploys

**Via CLI:**
```bash
vercel --prod
```

### 5. Verify Deployment

After deployment, test the following endpoints:

```bash
# Health check
curl https://your-backend-domain.vercel.app/health

# Main endpoint
curl https://your-backend-domain.vercel.app/

# Auth session (requires valid session)
curl -H "Cookie: your_session_cookie" https://your-backend-domain.vercel.app/api/auth/session
```

## Key Endpoints for Testing

After deployment, verify these endpoints work:

| Feature | Endpoint | Method | Notes |
|---------|----------|--------|-------|
| Health Check | `/health` | GET | Database connectivity |
| Auth Session | `/api/auth/session` | GET | Requires valid session |
| Reports | `/api/reports` | GET/POST | Report management |
| NGOs | `/api/ngos` | GET | NGO listings |
| Payments | `/api/payments/*` | POST/GET | Stripe integration |
| Verification | `/api/verification` | POST | Email verification |
| Cases | `/api/cases` | GET/POST | Case management |

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Test connection locally: `prisma db execute --stdin < test.sql`
- Check Neon dashboard for connection limits

### CORS Errors
- Ensure `FRONTEND_URL` matches your frontend domain
- Add frontend domain to trusted origins in `src/app.ts`

### Stripe Webhook Issues
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe dashboard → Webhooks for delivery status
- Ensure webhook endpoint matches: `https://your-backend-domain.vercel.app/api/payments/webhook`

### Build Failures
1. Check build logs in Vercel Dashboard → Deployments
2. Verify `package.json` dependencies are compatible
3. Test build locally: `npm run build`

### Session/Auth Issues
- Verify `BETTER_AUTH_URL` matches deployment URL
- Check browser cookies are being sent correctly
- Ensure Google OAuth credentials are valid

## Production Best Practices

1. **Enable HTTPS**: Vercel automatically enables HTTPS
2. **Monitor Performance**: Use Vercel Analytics
3. **Set Up Error Tracking**: Integrate Sentry or similar
4. **Backup Database**: Regular backups of Neon PostgreSQL
5. **Monitor Logs**: Use Vercel Function Logs for debugging

## Monitoring & Logs

View logs in Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Select a deployment
4. Click "Runtime Logs" to see real-time logs

Or use Vercel CLI:
```bash
vercel logs --tail
```

## Rollback

If deployment fails:
1. Go to Vercel Dashboard → Deployments
2. Select previous successful deployment
3. Click "Promote to Production"

## Custom Domain Setup

1. Vercel Dashboard → Settings → Domains
2. Click "Add" and enter your domain
3. Follow DNS configuration instructions
4. Update `BETTER_AUTH_URL` to your custom domain

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
npm run build
git push
```

### Database Migrations
Prisma migrations are run automatically during build. To manually run:
```bash
npx prisma migrate deploy
```

### Clear Cache
Vercel Dashboard → Settings → Deployment → Redeploy → Select deployment → "Redeploy"

## Support & Debugging

### Enable Debug Logs
Add to Environment Variables:
```
DEBUG=*
```

### Test Endpoints Using cURL

```bash
# Test health check
curl https://your-backend-domain.vercel.app/health

# Create report (requires auth token)
curl -X POST https://your-backend-domain.vercel.app/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"HARASSMENT"}'
```

## Emergency Contacts

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Neon Support: [neon.tech/support](https://neon.tech/support)
- Stripe Support: [stripe.com/support](https://stripe.com/support)
