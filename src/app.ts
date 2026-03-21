import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { auth } from './app/config/auth';
import { authenticate, requireRole } from './app/middleware/auth';


const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/auth', auth.handler);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
app.get(
  '/api/test-protected',
  authenticate,
  requireRole('SUPER_ADMIN'),
  (req, res) => {
    res.json({
      message: 'You are authorized!',
      user: req.user,
    });
  }
);

// test route
app.get('/', (req, res) => {
  res.send(' Nirob kontho API is Running...');
});

// global error handler
app.use(globalErrorHandler);

export default app;