# Visual Fix Guide for 500 Error

## What's Happening (Why You See 500 Error)

```
Your .env file:
┌─────────────────────────────────┐
│ BETTER_AUTH_URL=                │
│ http://localhost:5000           │ ← Wrong for Vercel!
└─────────────────────────────────┘
              ↓
         Server thinks it's local
              ↓
    Vercel tries to run app
              ↓
         URLs don't match!
              ↓
    Auth validation fails
              ↓
    🔴 500 INTERNAL_SERVER_ERROR
```

## The Fix (What To Do)

```
Step 1: Get Vercel URL
┌─────────────────────────────────────────────────┐
│ vercel.com/dashboard                           │
│ → Click "nirapod-kontho-backend"              │
│ → Copy URL shown at top                        │
│ Example: https://nirapod-kontho-backend-xxx... │
└─────────────────────────────────────────────────┘

Step 2: Update Vercel Settings
┌─────────────────────────────────────────────────┐
│ Settings → Environment Variables               │
│ Find: BETTER_AUTH_URL = http://localhost:5000 │
│ Change to: https://nirapod-kontho-backend-xxx │
│ Click Save                                      │
└─────────────────────────────────────────────────┘

Step 3: Redeploy
┌─────────────────────────────────────────────────┐
│ Deployments tab                                 │
│ → Click failed deployment (red X)              │
│ → Click "Redeploy"                            │
│ → Wait 3-5 minutes                            │
└─────────────────────────────────────────────────┘

Step 4: Test
┌─────────────────────────────────────────────────┐
│ curl https://your-url.vercel.app/health       │
│ Should return: {"status":"ok",...}            │
│ ✅ Green checkmark = Success!                 │
└─────────────────────────────────────────────────┘
```

## After Fix - Architecture Works Correctly

```
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
│   localhost:3000                    │
└──────────────┬──────────────────────┘
               │ API Call
               ↓
┌─────────────────────────────────────┐
│   Backend (Express on Vercel)       │
│   https://your-vercel-url.app       │ ← URLs match now!
└──────────────┬──────────────────────┘
               │ Query
               ↓
┌─────────────────────────────────────┐
│   PostgreSQL (Neon)                 │
│   Database                          │
└─────────────────────────────────────┘

Result: ✅ Everything works!
```

## Side-by-Side Comparison

### ❌ BEFORE (Broken)
```
BETTER_AUTH_URL = http://localhost:5000
Vercel URL     = https://nirapod-kontho-backend-abc.vercel.app

Mismatch! → 500 Error
```

### ✅ AFTER (Fixed)
```
BETTER_AUTH_URL = https://nirapod-kontho-backend-abc.vercel.app
Vercel URL     = https://nirapod-kontho-backend-abc.vercel.app

Match! → Works perfectly
```

## Environment Variables Table

```
┌──────────────────────────┬──────────────────────────────────────┐
│ Variable                 │ Current Value (in Vercel)            │
├──────────────────────────┼──────────────────────────────────────┤
│ DATABASE_URL             │ [Should be set - from Neon]          │
│ STRIPE_SECRET_KEY        │ [Should be set - from Stripe]        │
│ STRIPE_WEBHOOK_SECRET    │ [Should be set - from Stripe]        │
│ GOOGLE_CLIENT_ID         │ [Should be set - from Google]        │
│ GOOGLE_CLIENT_SECRET     │ [Should be set - from Google]        │
│ BETTER_AUTH_URL          │ ❌ http://localhost:5000             │
│                          │ ✅ https://your-vercel-url.app       │
│ FRONTEND_URL             │ http://localhost:3000                │
│ CLIENT_URL               │ http://localhost:3000                │
│ NODE_ENV                 │ production                           │
└──────────────────────────┴──────────────────────────────────────┘
```

## Expected Test Results

### Test 1: Health Endpoint
```
curl https://your-vercel-url.vercel.app/health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-03-31T10:30:45.123Z",
  "uptime": 245.678,
  "environment": "production"
}

✅ This means server is healthy!
```

### Test 2: API Status
```
curl https://your-vercel-url.vercel.app/

Response (200 OK):
Nirapod Kontho API is Running...

✅ This means API is responding!
```

### Test 3: Check Logs
```
Vercel Dashboard → Deployments → Latest → Runtime Logs

✅ No red error messages
✅ Green status indicators
✅ Clean deployment
```

## Troubleshooting Flow

```
Start: Still getting 500 error after fix?
  │
  ├─→ Check Vercel logs (Runtime Logs tab)
  │   │
  │   ├─→ See "baseURL undefined"? 
  │   │   └─→ BETTER_AUTH_URL still wrong
  │   │
  │   ├─→ See "DATABASE_URL not set"?
  │   │   └─→ Add DATABASE_URL variable
  │   │
  │   ├─→ See "STRIPE not set"?
  │   │   └─→ Add STRIPE variables
  │   │
  │   └─→ See other error?
  │       └─→ Fix that specific variable
  │
  ├─→ Did you click "Redeploy"?
  │   └─→ If no, click it now
  │
  └─→ Waited 5 minutes?
      └─→ If no, wait and try again
```

## Success Indicators

When fix is complete, you'll see:

```
✅ Vercel dashboard shows "Ready" or green checkmark
✅ /health endpoint returns 200 with status: "ok"
✅ No more 500 errors in browser
✅ Vercel logs show no red errors
✅ App responding to requests
✅ Database connected
✅ Auth working
```

## Time Estimates

```
Update BETTER_AUTH_URL:     1 minute
Verify other variables:     1 minute  
Click Redeploy:            30 seconds
Wait for deployment:       3-5 minutes
Test endpoints:            1 minute
─────────────────────────────────────
Total Time:                5-8 minutes
```

---

**If you complete all 4 steps above and still see 500 error:**
1. Check Vercel Runtime Logs
2. Note the exact error message
3. Refer to FIX_500_ERROR.md for that specific error
4. Contact support with the error message

Good luck! 🚀
