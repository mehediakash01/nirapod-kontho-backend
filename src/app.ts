import express, { Request, Response } from 'express';
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
import { UserRoutes } from './app/modules/user/user.route';
import OAuthRoutes from './app/modules/oauth/oauth.route';
import OAuthCallbackRoutes from './app/modules/oauth/oauth.callback';
import OAuthSessionRoutes from './app/modules/oauth/oauth.session';


const app = express();
app.set('trust proxy', 1);
const authHandler = toNodeHandler(auth);

const buildForwardedHeaders = (req: Request) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
      continue;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  return headers;
};

const normalizeOrigin = (origin?: string) => origin?.trim().replace(/\/$/, '');
const frontendOriginPattern = /^https:\/\/nirapod-kontho-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/;
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    'https://nirapod-kontho-frontend.vercel.app',
    'http://localhost:3000',
  ]
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin))
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!normalizedOrigin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(normalizedOrigin) || frontendOriginPattern.test(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Tab-ID',
  ],
  optionsSuccessStatus: 204,
};

// Stripe webhook must use raw body and be mounted before express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);



// middlewares
app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
app.get('/api/auth/session', async (req: Request, res: Response) => {
  try {
    // Prevent ALL caching - must always fetch fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const sessionResult = await (auth.api.getSession as any)({
      method: 'GET',
      headers: buildForwardedHeaders(req),
      query: req.query as Record<string, string>,
      asResponse: false,
      returnHeaders: true,
    } as any).catch(() => null);

    if (!sessionResult?.response) {
      return res.status(401).json({ error: 'No active session' });
    }

    const setCookie = sessionResult.headers?.getSetCookie?.() ?? [];
    if (setCookie.length > 0) {
      res.setHeader('Set-Cookie', setCookie);
    }

    sessionResult.headers?.forEach((value: string, key: string) => {
      if (key.toLowerCase() === 'set-cookie') {
        return;
      }

      res.setHeader(key, value);
    });

    const sessionResponse = sessionResult.response;

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
app.use('/api/users', UserRoutes);
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
