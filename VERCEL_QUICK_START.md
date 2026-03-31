# Vercel Deployment - Quick Start Guide

This guide will help you deploy the Nirapod Kontho backend to Vercel in under 10 minutes.

## ⚡ Prerequisites Checklist

- [ ] Vercel account (free at [vercel.com](https://vercel.com))
- [ ] GitHub/GitLab/Bitbucket account with code pushed
- [ ] Neon PostgreSQL database created
- [ ] Stripe account with API keys
- [ ] Google OAuth credentials
- [ ] Your frontend domain

## 🚀 5-Step Deployment Process

### Step 1: Prepare Repository (2 min)

```bash
cd d:\project\nirapod-kontho-backend

# Build locally to verify no errors
npm run build

# Commit all changes
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

**Verify**: No build errors, all changes pushed to Git.

---

### Step 2: Create Vercel Project (2 min)

**Option A: Web Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Select your Git repository
4. Click "Import"

**Option B: CLI**
```bash
npm install -g vercel
vercel
# Follow prompts
```

**Verify**: Project appears in Vercel dashboard.

---

### Step 3: Configure Environment Variables (3 min)

In Vercel Dashboard → Project Settings → Environment Variables:

**Add These Variables:**

```
DATABASE_URL
postgresql://user:password@host/database?sslmode=verify-full&channel_binding=require

PORT
5000

NODE_ENV
production

BETTER_AUTH_URL
https://your-vercel-project.vercel.app

FRONTEND_URL
https://your-frontend-domain.com (or http://localhost:3000 for dev)

CLIENT_URL
https://your-frontend-domain.com (or http://localhost:3000 for dev)

STRIPE_SECRET_KEY
sk_live_your_actual_key

STRIPE_WEBHOOK_SECRET
whsec_your_actual_secret

GOOGLE_CLIENT_ID
your_client_id.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
your_client_secret
```

**Verify**: 
- All variables are set
- No typos in values
- Production values are used

---

### Step 4: Configure Build Settings (1 min)

In Vercel Dashboard → Project Settings → Build & Development Settings:

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Verify**: Settings match above.

---

### Step 5: Deploy & Verify (2 min)

**Option A: Auto-Deploy**
Simply push to main branch:
```bash
git push origin main
```
Vercel automatically deploys.

**Option B: Manual Deploy**
```bash
vercel --prod
```

**Watch Deployment:**
- Go to Vercel Dashboard → Deployments
- Wait for "Ready" status (usually 2-3 min)

---

## ✅ Post-Deployment Verification

Test your deployed API:

### 1. Health Check
```bash
curl https://your-vercel-project.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-31T...",
  "uptime": 123.456,
  "environment": "production"
}
```

### 2. API Status
```bash
curl https://your-vercel-project.vercel.app/
```

Expected: `Nirapod Kontho API is Running...`

### 3. Check Logs
```bash
vercel logs --tail
```

Should show no errors.

---

## 🚨 Common Issues & Quick Fixes

### ❌ Build Failed

**Solution:**
1. Check build logs: Vercel Dashboard → Deployments → [Failed Deploy] → Runtime Logs
2. Run locally: `npm run build`
3. Fix errors then push again
4. Redeploy: `vercel --prod`

---

### ❌ Database Connection Error

**Solution:**
1. Verify `DATABASE_URL` is correct in Neon dashboard
2. Ensure IP addresses are allowed (Neon: Settings → Allowed IPs)
3. Test connection: `psql <DATABASE_URL>`
4. Update in Vercel and redeploy

---

### ❌ Authentication Failing

**Solution:**
1. Update `BETTER_AUTH_URL` to your Vercel domain
2. Ensure `FRONTEND_URL` is correct
3. Check browser cookies are enabled
4. Verify Google OAuth callback URL is set to: `https://your-vercel-domain.vercel.app/api/callback/google`

---

### ❌ Stripe Webhook Not Working

**Solution:**
1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Set URL: `https://your-vercel-domain.vercel.app/api/payments/webhook`
4. Select events: `charge.succeeded`, `charge.failed`, `customer.subscription.*`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`
6. Redeploy

---

### ❌ CORS Errors

**Solution:**
1. Verify `FRONTEND_URL` matches your frontend domain exactly
2. Check no typos in the variable
3. Redeploy with: `vercel --prod`

---

## 📊 Deployment Status Examples

### ✅ Successful Deployment
```
✓ Production URL: https://nirapod-backend.vercel.app
✓ Status Checks: PASS
✓ Database: Connected
✓ API Health: OK
✓ Ready for use
```

### ⚠️ Partial Issues
```
✓ Deployment: SUCCESS
✓ API Working: YES
⚠️ Stripe Webhook: CHECK CONFIGURATION
⚠️ Google OAuth: VERIFY REDIRECT URL
→ Fix issues then redeploy
```

---

## 🆘 Need Help?

### Vercel Logs
```bash
# Stream live logs
vercel logs --tail

# Search logs
vercel logs --tail --grep "error"
```

### Test Endpoints with cURL

**Test Auth Session:**
```bash
curl -v https://your-backend.vercel.app/api/auth/session
```

**Test Report Creation:**
```bash
curl -X POST https://your-backend.vercel.app/api/reports \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"HARASSMENT"}'
```

### Check Database

From Neon Dashboard:
1. Go to your database
2. Click "Query editor"
3. Run test query: `SELECT 1;`

---

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete checklist
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [README.md](./README.md) - General documentation

---

## 🎉 You're Done!

Your backend is now deployed on Vercel! 

**Next Steps:**
1. ✅ Share the backend URL with frontend team
2. ✅ Update frontend environment variables
3. ✅ Test full integration
4. ✅ Monitor deployment logs

**Monitoring:**
- Check Vercel Analytics → Performance
- Monitor error rates weekly
- Review database query metrics
- Track uptime and response times

---

**Deployment Date**: [Your Date]
**Backend URL**: https://your-domain.vercel.app
**Status**: ✅ Live and Ready

Need to redeploy? Simply push to main branch or run `vercel --prod`
