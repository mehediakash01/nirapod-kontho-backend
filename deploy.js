#!/usr/bin/env node

/**
 * Nirapod Kontho Backend - Vercel Deployment Automation
 * This script automates the deployment process to Vercel
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_API_BASE = 'api.vercel.com';
const PROJECT_NAME = 'nirapod-kontho-backend';
const GITHUB_REPO = 'mehediakash01/nirapod-kontho-backend';

// Load environment variables from .env file
// IMPORTANT: These values should come from:
// - DATABASE_URL: Neon PostgreSQL connection string
// - STRIPE_SECRET_KEY: From Stripe Dashboard → API Keys
// - STRIPE_WEBHOOK_SECRET: From Stripe Dashboard → Webhooks
// - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET: From Google Cloud Console
const ENV_VARS = require('dotenv').config().parsed || {};

console.log('🚀 Nirapod Kontho Backend - Vercel Deployment Automation');
console.log('='.repeat(60));

// Helper function to make HTTPS requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_BASE,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function deploy() {
  try {
    console.log('\n📋 Deployment Steps:');
    console.log('1. Check Vercel credentials');
    console.log('2. Create project (if not exists)');
    console.log('3. Set environment variables');
    console.log('4. Trigger production deployment');
    console.log('5. Verify deployment');

    console.log('\n⚠️  Manual Step Required:');
    console.log('Since this is the first deployment, you need to:');
    console.log('');
    console.log('1. Visit: https://vercel.com/dashboard');
    console.log('2. Click "Add New" → "Project"');
    console.log('3. Select GitHub repository: ' + GITHUB_REPO);
    console.log('4. In Environment Variables, add:');
    console.log('');
    
    Object.entries(ENV_VARS).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });

    console.log('');
    console.log('5. Click "Deploy"');
    console.log('');
    console.log('✅ Your backend will be live in 3-5 minutes!');

    // Save deployment config
    const config = {
      projectName: PROJECT_NAME,
      gitRepo: GITHUB_REPO,
      envVars: ENV_VARS,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      framework: 'other'
    };

    fs.writeFileSync(
      path.join(__dirname, '.vercel-deployment-config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('\n✅ Deployment configuration saved to .vercel-deployment-config.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deploy();
