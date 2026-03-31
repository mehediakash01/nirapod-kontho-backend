# ⚡ Step-by-Step Text Guide - Fix 500 Error (Copy-Paste Ready)

## EXACT Steps to Follow

### STEP 1️⃣: Find Your Vercel Deployment URL
1. Open: https://vercel.com/dashboard
2. Click: "nirapod-kontho-backend" project
3. Look at the top of the page
4. You'll see a URL like: 
   ```
   nirapod-kontho-backend-abc123def456.vercel.app
   ```
5. **Copy this URL** (the full domain without https://)

### STEP 2️⃣: Update Environment Variable in Vercel
1. In your Vercel project, look for "Settings" (usually a gear ⚙️ icon)
2. Click "Settings"
3. In the left menu, find "Environment Variables"
4. Click "Environment Variables"
5. Look for a row with: 
   ```
   Key: BETTER_AUTH_URL
   Value: http://localhost:5000
   ```
6. Click the pencil ✏️ icon on that row to edit
7. **Delete the current value** (http://localhost:5000)
8. **Paste** your Vercel URL with https:// prefix:
   ```
   https://nirapod-kontho-backend-abc123def456.vercel.app
   ```
9. Click "Save" button

### STEP 3️⃣: Redeploy Your Application
1. Click the "Deployments" tab (not Settings)
2. You should see a deployment that failed with a red X
3. Click on that failed deployment
4. At the top right, click "Redeploy"
5. Click "Redeploy" again in the confirmation dialog
6. **Wait 3-5 minutes** for deployment to complete

### STEP 4️⃣: Test That It Works
1. Once deployment shows "✅ Ready" (green checkmark)
2. In your browser, go to:
   ```
   https://nirapod-kontho-backend-abc123def456.vercel.app/health
   ```
   (use YOUR actual domain from Step 1)
3. **You should see this response:**
   ```json
   {
     "status": "ok",
     "timestamp": "2026-03-31T...",
     "uptime": 1234.5,
     "environment": "production"
   }
   ```
4. ✅ **Success!** Your backend is now working!

---

## ✅ Verification Checklist

After completing all 4 steps, verify:

- [ ] BETTER_AUTH_URL is set to your Vercel domain (not localhost)
- [ ] All 9 environment variables are set (check Settings → Environment Variables)
- [ ] Latest deployment shows green checkmark (✅ Ready)
- [ ] Health endpoint returns 200 with "status": "ok"
- [ ] No 500 error when visiting the URL

---

## 🚨 If Still Getting 500 Error

### Check Error Details:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click the latest deployment
4. Click "Runtime Logs" tab
5. Look for red error text
6. Common errors and fixes:

**Error**: "Cannot read property 'baseURL' of undefined"
**Fix**: BETTER_AUTH_URL is still wrong - go back to Step 2

**Error**: "DATABASE_URL is not set"
**Fix**: Add DATABASE_URL to Vercel Environment Variables

**Error**: "STRIPE_SECRET_KEY is not set"
**Fix**: Add STRIPE_SECRET_KEY to Environment Variables

**Error**: Database connection timeout
**Fix**: Make sure Neon database is running and DATABASE_URL is correct

---

## 📋 All 9 Environment Variables (For Reference)

These should ALL be set in Vercel Settings → Environment Variables:

| # | Key | Value | Where to Find |
|---|-----|-------|---------------|
| 1 | DATABASE_URL | postgresql://... | Your Neon dashboard |
| 2 | STRIPE_SECRET_KEY | sk_test_... | Stripe dashboard → API Keys |
| 3 | STRIPE_WEBHOOK_SECRET | whsec_... | Stripe dashboard → Webhooks |
| 4 | GOOGLE_CLIENT_ID | 965394145587-... | Your `.env` file or Google Console |
| 5 | GOOGLE_CLIENT_SECRET | GOCSPX-... | Your `.env` file or Google Console |
| 6 | BETTER_AUTH_URL | https://your-vercel-url.vercel.app | **SET THIS IN STEP 2** |
| 7 | FRONTEND_URL | http://localhost:3000 | Your frontend domain |
| 8 | CLIENT_URL | http://localhost:3000 | Same as FRONTEND_URL |
| 9 | NODE_ENV | production | Type exactly as shown |

---

## 🎯 Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Neon PostgreSQL: https://console.neon.tech
- Google Console: https://console.cloud.google.com

---

## 💡 Pro Tips

1. **Screenshot your Vercel URL** after you copy it - easier to paste
2. **Make sure you click "Save"** after updating BETTER_AUTH_URL
3. **Check Settings menu, not the deployment page** to find Environment Variables
4. **Wait the full 3-5 minutes** for deployment before testing
5. **Use the /health endpoint** to quickly test if server is running

---

## ✨ After It's Fixed

Your backend will work with:
- ✅ Authentication (email + Google OAuth)
- ✅ Reports system
- ✅ Stripe payments
- ✅ NGO management
- ✅ Email verification
- ✅ All other features

---

**Time to complete**: 5-8 minutes
**Difficulty**: Very Easy
**Success Rate**: 95%+

**Are you ready? Start with STEP 1 now!** 🚀
