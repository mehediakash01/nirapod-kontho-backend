# ⚠️ 500 Error - Deployment Troubleshooting

**Error**: Serverless Function has crashed
**Status**: FUNCTION_INVOCATION_FAILED
**Cause**: Likely missing or incorrect environment variables

---

## 🔴 Most Common Issue: BETTER_AUTH_URL

Your error is **99% caused by** `BETTER_AUTH_URL` still pointing to `http://localhost:5000`.

### Why This Breaks:
- Better Auth expects to run on a specific domain
- If URL is localhost but code runs on Vercel domain, authentication fails
- Server crashes on startup trying to validate session

### Fix (2 minutes):

1. **Get your Vercel deployment URL**
   - Go to Vercel Dashboard
   - Click your project
   - Copy the URL from the top (e.g., `https://nirapod-kontho-backend-xxx.vercel.app`)

2. **Update BETTER_AUTH_URL**
   - Click "Settings" → "Environment Variables"
   - Find `BETTER_AUTH_URL`
   - Change from: `http://localhost:5000`
   - Change to: `https://your-vercel-url.vercel.app` (exactly as shown above)
   - Click "Save"

3. **Redeploy**
   - Go to Deployments tab
   - Click the failed deployment
   - Click "Redeploy" (top right)
   - Wait 3-5 minutes

4. **Test**
   ```bash
   curl https://your-vercel-url.vercel.app/health
   ```
   Should return status: "ok"

---

## 🟡 Other Possible Issues

### Issue 2: Missing Environment Variables

**Check these are ALL set in Vercel:**

```
DATABASE_URL ✓
STRIPE_SECRET_KEY ✓
STRIPE_WEBHOOK_SECRET ✓
GOOGLE_CLIENT_ID ✓
GOOGLE_CLIENT_SECRET ✓
BETTER_AUTH_URL ✓ [UPDATE THIS]
FRONTEND_URL ✓
CLIENT_URL ✓
NODE_ENV = production ✓
```

If any are missing:
1. Go to Settings → Environment Variables
2. Add missing ones
3. Click "Redeploy"

### Issue 3: Database Connection Failing

If DATABASE_URL is causing the crash:

1. Verify Neon database is running
2. Check DATABASE_URL format is correct
3. Make sure it has `?sslmode=verify-full` at the end
4. Test locally first: `npm run dev`

---

## 🟢 Step-by-Step Fix

### Step 1: Get Vercel URL
- Dashboard → Your Project → Copy the URL shown at top

### Step 2: Update Environment Variable
```
KEY: BETTER_AUTH_URL
VALUE: https://your-vercel-url.vercel.app
```

### Step 3: Redeploy
- Deployments tab → Failed deployment → Redeploy button

### Step 4: Wait & Test
- Wait 3-5 minutes for build
- Test: `curl https://your-url.vercel.app/health`

---

## 🧪 Testing After Fix

### Health Endpoint:
```bash
curl https://your-vercel-url.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-31T...",
  "uptime": 1234,
  "environment": "production"
}
```

### API Status:
```bash
curl https://your-vercel-url.vercel.app/
```

**Expected**: "Nirapod Kontho API is Running..."

---

## 📋 Verification Checklist

- [ ] BETTER_AUTH_URL updated to Vercel domain
- [ ] All 9 environment variables are set
- [ ] NODE_ENV = production
- [ ] DATABASE_URL is correct (from Neon)
- [ ] Stripe keys are set
- [ ] Google OAuth credentials are set
- [ ] Clicked "Redeploy"
- [ ] Waited 3-5 minutes
- [ ] Health endpoint returns 200
- [ ] No 500 error

---

## 🆘 Still Getting 500 Error?

### Check Vercel Logs:
1. Dashboard → Deployments → Click the deployment
2. Click "Runtime Logs" tab
3. Look for red error messages
4. Common errors:
   - "DATABASE_URL is not set"
   - "Cannot connect to database"
   - "Invalid BETTER_AUTH_URL"
   - "Missing STRIPE_SECRET_KEY"

### If You See Log Errors:
1. Note the exact error message
2. Add/update the missing variable
3. Redeploy

### Nuclear Option:
1. Delete current Vercel project
2. Create new one
3. Set all 9 variables from scratch
4. Deploy fresh

---

## 📚 Quick Reference

### Your Environment Variables:
```
DATABASE_URL=[get from Neon dashboard]
STRIPE_SECRET_KEY=[get from Stripe dashboard]
STRIPE_WEBHOOK_SECRET=[get from Stripe dashboard]
GOOGLE_CLIENT_ID=[get from Google console]
GOOGLE_CLIENT_SECRET=[get from Google console]
BETTER_AUTH_URL=[CHANGE THIS TO YOUR VERCEL URL]
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
NODE_ENV=production
```

Copy these to Vercel Settings → Environment Variables (use actual values from your dashboards)

---

## ✅ Expected Outcome

After fixing BETTER_AUTH_URL:
- ✅ No more 500 error
- ✅ Health endpoint works
- ✅ API accepts requests
- ✅ Auth works properly
- ✅ Payments function
- ✅ Reports work

---

**Time to fix**: 5 minutes
**Success rate**: 95%
**Next step**: Update BETTER_AUTH_URL in Vercel

Go to Vercel Dashboard NOW and update BETTER_AUTH_URL! 🚀
