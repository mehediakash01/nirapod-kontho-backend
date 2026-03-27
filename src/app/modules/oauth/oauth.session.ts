import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';

const router = Router();

// Session endpoint to retrieve user from session token
router.get('/session', async (req: Request, res: Response) => {
  try {
    // Get the session token from cookies
    const cookies = req.headers.cookie || '';
    const authTokenMatch = cookies.match(/auth-token=([^;]+)/);
    const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
    
    const token = authTokenMatch?.[1] || sessionTokenMatch?.[1];

    if (!token) {
      return res.status(401).json({ error: 'No session token found' });
    }

    console.log('Looking up session with token:', token.substring(0, 20) + '...');

    // Find the session in database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      console.log('Session not found');
      return res.status(401).json({ error: 'Session not found' });
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      console.log('Session expired');
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session expired' });
    }

    console.log('Session found for user:', session.user.email);

    // Return the user data
    return res.status(200).json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Session endpoint error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

