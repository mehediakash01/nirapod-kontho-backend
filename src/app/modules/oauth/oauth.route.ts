import { Router, Request, Response } from 'express';

const router = Router();

// OAuth endpoint helper
router.get('/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    
    if (provider !== 'google') {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google Client ID not configured' });
    }

    // Redirect URI - should point to backend callback
    const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:5000'}/api/oauth/callback/google`;
    const scope = 'openid profile email';
    const state = Math.random().toString(36).substring(7);

    // Store state in session for verification
    (req as any).session = (req as any).session || {};
    (req as any).session.oauthState = state;

    // Generate Google OAuth authorization URL
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('redirect_uri', redirectUri);
    oauthUrl.searchParams.append('response_type', 'code');
    oauthUrl.searchParams.append('scope', scope);
    oauthUrl.searchParams.append('state', state);
    oauthUrl.searchParams.append('access_type', 'offline');
    oauthUrl.searchParams.append('prompt', 'consent');

    console.log('Generated OAuth URL:', oauthUrl.toString());
    console.log('Redirect URI:', redirectUri);
    console.log('Client ID:', clientId.substring(0, 20) + '...');
    
    res.json({ url: oauthUrl.toString() });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

export default router;
