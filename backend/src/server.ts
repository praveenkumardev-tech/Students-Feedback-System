import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { database } from './services/database';

// Import routes
import authRoutes from './routes/auth';
import formsRoutes from './routes/forms';
import feedbackRoutes from './routes/feedback';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Add feedback routes to forms router for GET /api/forms/:formId/feedback
app.use('/api/forms', feedbackRoutes);

// Root endpoint
app.get('/api/', (req, res) => {
  res.json({ message: 'Teacher Feedback Collection System API' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ detail: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ detail: 'Not found' });
});

// Database connection and server start
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

startServer();