import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import modelsRouter from './routes/models';
import promptsRouter from './routes/prompts';
import datasetsRouter from './routes/datasets';
import trainingRouter from './routes/training';
import authRouter from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-orchestration-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/models', modelsRouter);
app.use('/api/v1/prompts', promptsRouter);
app.use('/api/v1/datasets', datasetsRouter);
app.use('/api/v1/training-jobs', trainingRouter);

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'AI Orchestration API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      models: '/api/v1/models',
      prompts: '/api/v1/prompts',
      datasets: '/api/v1/datasets',
      trainingJobs: '/api/v1/training-jobs',
    },
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
