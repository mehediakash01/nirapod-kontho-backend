import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';


const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// test route
app.get('/', (req, res) => {
  res.send(' Nirob kontho API is Running...');
});

// global error handler
app.use(globalErrorHandler);

export default app;