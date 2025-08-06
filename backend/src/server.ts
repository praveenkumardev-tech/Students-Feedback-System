import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { database } from './services/database';

import authRoutes from './routes/auth';
import formsRoutes from './routes/forms';
import feedbackRoutes from './routes/feedback';

dotenv.config();
const app = express();
const PORT = parseInt(process.env.PORT || '8001', 10);

app.use(helmet());
app.use(cors({ origin: '*', credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['*'] }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 1000 }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/', (_req, res) => res.json({ message: 'Teacher Feedback Collection System API' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ detail: 'Internal server error' });
});

app.use('*', (_req, res) => {
  res.status(404).json({ detail: 'Not found' });
});

const startServer = async () => {
  try {
    await database.connect();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`MongoDB: ${process.env.MONGO_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => { console.log('Shutting down…'); await database.disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { console.log('Shutting down…'); await database.disconnect(); process.exit(0); });

startServer();
