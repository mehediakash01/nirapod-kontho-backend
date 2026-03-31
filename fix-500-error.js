#!/usr/bin/env node

/**
 * Vercel Deployment Troubleshooting Script
 * This diagnoses common 500 error issues after Vercel deployment
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 Vercel Deployment Troubleshooting');
console.log('='.repeat(60));

const COMMON_ISSUES = [
  {
    issue: '❌ BETTER_AUTH_URL still points to localhost',
    solution: 'Update to your Vercel domain: https://your-vercel-url.vercel.app',
    fix: 'Go to Vercel Dashboard → Settings → Environment Variables → Update BETTER_AUTH_URL'
  },
  {
    issue: '❌ DATABASE_URL not set or malformed',
    solution: 'Verify DATABASE_URL is correctly set in Vercel',
    fix: 'Check Neon dashboard and copy exact connection string to Vercel'
  },
  {
    issue: '❌ Missing environment variables',
    solution: 'Need: DATABASE_URL, STRIPE_SECRET_KEY, GOOGLE_CLIENT_ID/SECRET, etc.',
    fix: 'Add all 9 variables from your .env file'
  },
  {
    issue: '❌ NODE_ENV not set to production',
    solution: 'Set NODE_ENV=production for production mode',
    fix: 'Add NODE_ENV=production to Vercel Environment Variables'
  }
];

console.log('\n📋 Common Issues & Solutions:\n');
COMMON_ISSUES.forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.issue}`);
  console.log(`   Solution: ${item.solution}`);
  console.log(`   Action: ${item.fix}\n`);
});

console.log('='.repeat(60));
console.log('\n✅ NEXT STEPS:\n');
console.log('1. Go to Vercel Dashboard → Select your project');
console.log('2. Click "Settings" → "Environment Variables"');
console.log('3. Check/Update these variables:');
console.log('   ✓ BETTER_AUTH_URL = https://your-vercel-domain.vercel.app');
console.log('   ✓ DATABASE_URL = [from Neon dashboard]');
console.log('   ✓ STRIPE_SECRET_KEY = [from Stripe dashboard]');
console.log('   ✓ STRIPE_WEBHOOK_SECRET = [from Stripe dashboard]');
console.log('   ✓ GOOGLE_CLIENT_ID = [from Google console]');
console.log('   ✓ GOOGLE_CLIENT_SECRET = [from Google console]');
console.log('   ✓ FRONTEND_URL = http://localhost:3000 or your domain');
console.log('   ✓ CLIENT_URL = http://localhost:3000 or your domain');
console.log('   ✓ NODE_ENV = production');
console.log('\n4. After updating variables, click "Redeploy"');
console.log('5. Wait 2-3 minutes for redeployment');
console.log('6. Test: curl https://your-vercel-domain.vercel.app/health');
console.log('\n' + '='.repeat(60));
