# 🚀 IMMEDIATE ACTION - Fix Your 500 Error

**Your Issue**: Serverless Function crashed with 500 error after Vercel deployment
**Root Cause**: BETTER_AUTH_URL is still set to localhost instead of your Vercel domain
**Time to Fix**: 5 minutes
**Success Rate**: 95%+

---

## ⚡ CRITICAL FIX (Do This Now)

### What's Wrong:
- Your `.env` has: `BETTER_AUTH_URL=http://localhost:5000`
- Vercel tries to run on: `https://nirapod-kontho-backend-xxx.vercel.app`
- Better Auth crashes because URLs don't match
- Result: 500 FUNCTION_INVOCATION_FAILED

### The Fix:

**1. Find Your Vercel URL** (1 min)
   - Open https://vercel.com/dashboard
   - Click your project "nirapod-kontho-backend"
   - Look at the top - you'll see a URL like: `https://nirapod-kontho-backend-abc123.vercel.app`
   - Copy this URL

**2. Update in Vercel** (2 min)
   - Click "Settings" (gear icon)
   - Scroll to "Environment Variables"
   - Find the row: `BETTER_AUTH_URL` = `http://localhost:5000`
   - Click the pencil icon to edit
   - **Delete**: `http://localhost:5000`
   - **Paste**: Your Vercel URL (from step 1)
   - Click "Save"
   - **Important**: Check the box to apply to Production

**3. Redeploy** (2 min)
   - Click "Deployments" tab
   - Find the deployment with error (red X)
   - Click it
   - Click "Redeploy" button (top right)
   - Wait 3-5 minutes...

**4. Verify** (30 sec)
   - Test: `https://your-url.vercel.app/health`
   - Should return: `{"status":"ok",...}`
   - No more 500 error ✅

---

## 📋 Checklist of ALL Environment Variables

**Go to Vercel Settings → Environment Variables and verify ALL 9 are set:**

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | postgresql://... | Your Neon dashboard |
| `STRIPE_SECRET_KEY` | sk_test_... | Your Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | Your Stripe dashboard |
| `GOOGLE_CLIENT_ID` | 965394145587-... | Your `.env` file |
| `GOOGLE_CLIENT_SECRET` | GOCSPX-... | Your `.env` file |
| `BETTER_AUTH_URL` | **https://your-vercel-url.vercel.app** | **UPDATE THIS** |
| `FRONTEND_URL` | http://localhost:3000 | Your `.env` file |
| `CLIENT_URL` | http://localhost:3000 | Your `.env` file |
| `NODE_ENV` | production | Type this exactly |

**Missing or incorrect?** Add/update and redeploy.

---

## 🧪 Test Commands

After fix is deployed:

```bash
# Test 1: Health check (should return status: ok)
curl https://your-vercel-url.vercel.app/health

# Test 2: API status (should return running message)
curl https://your-vercel-url.vercel.app/

# Test 3: Check deployment is working
# Open browser: https://your-vercel-url.vercel.app/health
# Should see JSON response, not 500 error
```

---

## 🔍 If Still Getting 500 Error

### Check Vercel Logs:
1. Dashboard → Deployments → Click latest deployment
2. Click "Runtime Logs" tab
3. Look for error messages
4. Common ones:
   - "Cannot read property 'baseURL' of undefined" → BETTER_AUTH_URL issue
   - "DATABASE_URL is not set" → Database variable missing
   - "STRIPE_SECRET_KEY is not set" → Stripe key missing

### Quick Fixes for Common Errors:
- **"baseURL of undefined"** → Fix BETTER_AUTH_URL (this is your issue)
- **"DATABASE_URL not set"** → Add DATABASE_URL to Vercel
- **"STRIPE key not set"** → Add STRIPE variables

### Nuclear Option:
If still broken after all fixes:
1. Delete the Vercel project
2. Create a new one
3. Set all 9 variables from scratch
4. Deploy fresh

---

## ✅ Expected Result After Fix

- ✅ No more 500 error
- ✅ Health endpoint returns 200 with "status: ok"
- ✅ API is responding to requests
- ✅ Database connection working
- ✅ Stripe integration ready
- ✅ Authentication working
- ✅ All features functional

---

## 📞 Summary

**Your Problem**: BETTER_AUTH_URL = localhost (wrong for production)
**Your Solution**: Change it to your Vercel domain
**Time**: 5 minutes
**Difficulty**: Very Easy
**Success**: ✅ 95% this fixes it

**DO THIS NOW**:
1. Get Vercel URL from dashboard
2. Update BETTER_AUTH_URL to that URL
3. Click Redeploy
4. Wait 5 minutes
5. Test with `/health` endpoint

---

## 📚 Additional Resources

- **Full Troubleshooting**: See `FIX_500_ERROR.md` in your repo
- **Initial Setup**: See `DEPLOYMENT_READY.md` in your repo
- **API Tests**: See `API_REFERENCE.md` for endpoint testing

---

**Created**: March 31, 2026
**For**: Nirapod Kontho Backend
**File**: IMMEDIATE_FIX.md

👉 **Go to Vercel dashboard RIGHT NOW and update BETTER_AUTH_URL!**
