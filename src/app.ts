import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// test route
app.get('/', (req, res) => {
  res.send('Nirapod Kontho API Running...');
});

export default app;