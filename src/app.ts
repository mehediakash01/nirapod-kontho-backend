import express, { Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { auth } from './app/config/auth';
import { prisma } from './app/config/prisma';
import { toNodeHandler } from 'better-auth/node';
import { ReportRoutes } from './app/modules/report/report.route';
import { VerificationRoutes } from './app/modules/verification/verification.route';
import { NgoRoutes } from './app/modules/ngo/ngo.route';
import { CaseRoutes } from './app/modules/case/case.route';
import { NotificationRoutes } from './app/modules/notification/notificaiton.route';
import { PaymentRoutes } from './app/modules/payment/payment.route';
import { PaymentController } from './app/modules/payment/payment.controller';
import OAuthRoutes from './app/modules/oauth/oauth.route';
import OAuthCallbackRoutes from './app/modules/oauth/oauth.callback';
import OAuthSessionRoutes from './app/modules/oauth/oauth.session';


const app = express();
const authHandler = toNodeHandler(auth);

// Stripe webhook must use raw body and be mounted before express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);



// middlewares
app.use(express.json());
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.all('/api/auth/signup', (req, res) => {
  req.url = '/api/auth/sign-up/email';
  return authHandler(req, res);
});
app.all('/api/auth/signin', (req, res) => {
  req.url = '/api/auth/sign-in/email';
  return authHandler(req, res);
});

// Custom session endpoint to ensure role is always returned
app.get('/api/auth/session', async (req: any, res: Response) => {
  try {
    // Prevent ALL caching - must always fetch fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    // Get session using headers directly
    const headersObject: Record<string, string> = {};
    if (req.headers.cookie) {
      headersObject['cookie'] = req.headers.cookie;
    }
    if (req.headers.authorization) {
      headersObject['authorization'] = req.headers.authorization;
    }

    const sessionResponse = await auth.api.getSession({
      headers: headersObject,
    } as any);

    if (!sessionResponse || !sessionResponse.user) {
      return res.status(401).json({ error: 'No active session' });
    }

    // Extract session data
    const session = (sessionResponse as any).session || sessionResponse;
    const user = sessionResponse.user;

    // Verify session is not expired
    if (session?.expiresAt && new Date((session as any).expiresAt) < new Date()) {
      console.log(`[Session] Session expired for user ${user.id}`);
      return res.status(401).json({ error: 'Session expired' });
    }

    // Fetch FRESH user data from database every time
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!fullUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    console.log(`[Session] Valid session for user: ${fullUser.email} (${fullUser.role})`);

    return res.status(200).json({
      data: {
        user: fullUser,
        session: {
          id: (session as any)?.id || '',
          expiresAt: (session as any)?.expiresAt,
        },
      },
      user: fullUser,
    });
  } catch (error: any) {
    console.error('[Session] Error:', error.message);
    return res.status(401).json({ error: 'Failed to retrieve session' });
  }
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.use('/api/reports', ReportRoutes);
app.use('/api/verification', VerificationRoutes);
app.use('/api/ngos', NgoRoutes);
app.use('/api/cases', CaseRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/payments', PaymentRoutes);
app.use('/api/oauth/callback', OAuthCallbackRoutes);
app.use('/api/oauth', OAuthSessionRoutes);
app.use('/api/oauth', OAuthRoutes);

// Better-auth handler for remaining auth routes
app.all('/api/auth', authHandler);
app.all('/api/auth/*splat', authHandler);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// test route
app.get('/', (req, res) => {
  res.send('Nirapod Kontho API is Running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// global error handler
app.use(globalErrorHandler);

export default app;