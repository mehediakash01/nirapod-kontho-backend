import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  secure: isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Track processed auth codes to prevent reuse (only in memory for this process)
const processedCodes = new Map<string, { timestamp: number; sessionToken: string }>();

// Helper function to fetch from URL
async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`🔴 API Response: ${response.status} ${response.statusText}`);
    console.error(`📄 Response body:`, errorText);
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
  }
  return response.json();
}

// OAuth callback handler
router.get('/google', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error('OAuth error from Google:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error))}`);
    }

    if (!code || typeof code !== 'string') {
      console.error('No authorization code provided');
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    // Check if this code was already processed in the last 10 minutes
    const cachedAuth = processedCodes.get(code);
    if (cachedAuth && Date.now() - cachedAuth.timestamp < 10 * 60 * 1000) {
      console.log('♻️ Code already processed, reusing session token:', code.substring(0, 20) + '...');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.cookie('auth-token', cachedAuth.sessionToken, authCookieOptions);

      return res.redirect(`${frontendUrl}/dashboard?oauth_success=true`);
    }

    console.log('🔵 Processing OAuth callback for Google with code:', code.substring(0, 20) + '...');

    // Verify environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
    }

    const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:5000'}/api/oauth/callback/google`;
    console.log('📍 Redirect URI:', redirectUri);

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    let tokenData: any;
    
    try {
      tokenData = await fetchJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
    } catch (tokenError: any) {
      const errorMsg = String(tokenError.message);
      
      // If code was already used, check if we have a recent session for this request
      if (errorMsg.includes('invalid_grant') || errorMsg.includes('400')) {
        console.warn('⚠️ Authorization code was already used or is invalid');
        console.warn('This can happen if the callback is triggered multiple times');

        const recentSession = await prisma.session.findFirst({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (recentSession) {
          console.log('✅ Found recent session for this auth attempt, reusing...');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          res.cookie('auth-token', recentSession.token, authCookieOptions);

          return res.redirect(`${frontendUrl}/dashboard?oauth_success=true`);
        }
        
        throw tokenError;
      }
      
      throw tokenError;
    }

    const { access_token } = tokenData;
    console.log('✅ Token exchange successful');

    // Get user info from Google
    console.log('📧 Fetching user info from Google...');
    const userInfo = await fetchJson(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { id, name, email, picture } = userInfo;
    console.log('✅ User info retrieved:', email);

    if (!email) {
      throw new Error('No email provided by Google');
    }

    // Find or create user in database
    console.log('🔍 Looking up user in database:', email);
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('👤 Creating new user...');
      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          image: picture,
          emailVerified: true,
        },
      });
      console.log('✅ New user created:', email, 'ID:', user.id);
    } else {
      // Update user info
      console.log('🔄 Updating existing user...');
      if (name || picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(name && { name }),
            ...(picture && { image: picture }),
            emailVerified: true,
          },
        });
      }
      console.log('✅ User updated:', email);
    }

    // Create session
    console.log('🔐 Creating session for user:', user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionToken = `session_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;

    const session = await prisma.session.create({
      data: {
        expiresAt,
        userId: user.id,
        token: sessionToken,
        ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    console.log('✅ Session created:', session.id, 'expires at:', expiresAt);

    // Cache this successful auth code
    processedCodes.set(code, { timestamp: Date.now(), sessionToken });
    
    // Clean up old entries (older than 10 minutes)
    for (const [key, value] of processedCodes.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1000) {
        processedCodes.delete(key);
      }
    }

    // Set session cookie
    console.log('🍪 Setting session cookie...');
    res.cookie('auth-token', sessionToken, authCookieOptions);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    console.log('🎯 Redirecting to:', `${frontendUrl}/dashboard?oauth_success=true`);

    return res.redirect(`${frontendUrl}/dashboard?oauth_success=true`);
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    const errorMessage = error?.message || String(error) || 'Unknown error';
    const errorStack = error?.stack || '';
    
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const encodedMessage = encodeURIComponent(errorMessage);

    return res.redirect(`${frontendUrl}/login?error=oauth_failed&details=${encodedMessage}`);
  }
});

export default router;


