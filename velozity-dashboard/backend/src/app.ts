import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { globalErrorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import clientsRoutes from './routes/clients.routes';
import projectsRoutes from './routes/projects.routes';
import tasksRoutes from './routes/tasks.routes';
import notificationsRoutes from './routes/notifications.routes';
import activityRoutes from './routes/activity.routes';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,           // Required for HttpOnly cookie exchange
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Auth rate limiting — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later', data: { code: 'RATE_LIMITED' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Velozity API is running', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
// Nest task routes under projects (mergeParams: true on tasks router)
app.use('/api/projects/:projectId/tasks', tasksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: { code: 'NOT_FOUND' } });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be the LAST middleware registered
app.use(globalErrorHandler);

export default app;
