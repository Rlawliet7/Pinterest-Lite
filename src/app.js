import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Core middlewares ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static frontend ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API routes ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'proj_image API',
    status: 'ok',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      upload: '/api/upload',
    },
    docs: 'See README.md',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res, next) => {
  console.warn('[WARN] Route not found:', req.method, req.originalUrl);
  next(new AppError('Route not found', 404));
});

// ── Central error handler ────────────────────────────────────
app.use(errorMiddleware);

export default app;