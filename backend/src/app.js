/**
 * app.js
 * Express application factory.
 * Wires middleware, routes and the centralised error handler.
 * No business logic lives here.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import healthRouter from './routes/health.js';
import infraRouter from './routes/infra.js';
import authRouter from './routes/auth.js';
import workspaceRouter from './routes/workspace.routes.js';
import settingsRouter from './routes/settings.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Proxy trust (correct IP behind nginx/load-balancer) ───
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// ── Body / cookie parsers ─────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/', infraRouter);          // /test-db  /test-redis
app.use('/auth', authRouter);       // /auth/signup /auth/login /auth/refresh …
app.use('/api/workspaces', workspaceRouter);
app.use('/api/settings', settingsRouter);

// ── 404 catch-all ─────────────────────────────────────────
app.use(notFound);

// ── Centralised error handler ─────────────────────────────
app.use(errorHandler);

export default app;
