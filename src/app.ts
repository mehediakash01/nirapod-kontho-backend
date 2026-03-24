import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { auth } from './app/config/auth';
import { toNodeHandler } from 'better-auth/node';
import { ReportRoutes } from './app/modules/report/report.route';
import { VerificationRoutes } from './app/modules/verification/verification.route';
import { NgoRoutes } from './app/modules/ngo/ngo.route';
import { CaseRoutes } from './app/modules/case/case.route';
import { NotificationRoutes } from './app/modules/notification/notificaiton.route';
import { PaymentRoutes } from './app/modules/payment/payment.route';
import { PaymentController } from './app/modules/payment/payment.controller';


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
app.use(cors());
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
app.all('/api/auth', authHandler);
app.all('/api/auth/*splat', authHandler);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.use('/api/reports', ReportRoutes);
app.use('/api/verification', VerificationRoutes);
app.use('/api/ngos', NgoRoutes);
app.use('/api/cases', CaseRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/payments', PaymentRoutes);
// test route
app.get('/', (req, res) => {
  res.send(' Nirob kontho API is Running...');
});

// global error handler
app.use(globalErrorHandler);

export default app;