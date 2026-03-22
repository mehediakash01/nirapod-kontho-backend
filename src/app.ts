import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { auth } from './app/config/auth';
import { toNodeHandler } from 'better-auth/node';
import { authenticate, requireRole } from './app/middleware/auth';
import { ReportRoutes } from './app/modules/report/report.route';


const app = express();
const authHandler = toNodeHandler(auth);

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

// test route
app.get('/', (req, res) => {
  res.send(' Nirob kontho API is Running...');
});

// global error handler
app.use(globalErrorHandler);

export default app;