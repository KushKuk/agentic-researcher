/**
 * server.js
 * Entry point.
 * Order: load env (via --env-file flag in package.json) → connect Prisma → connect Redis → start HTTP server.
 * The server will NOT start if either infra dependency is unavailable.
 */

import app from './app.js';
import { connectPrisma } from './config/prisma.js';
import { connectRedis } from './config/redis.js';

const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

async function bootstrap() {
    // ── Infrastructure ────────────────────────────────────────
    try {
        await connectPrisma();
    } catch (err) {
        console.error('[server] Prisma connection failed:', err.message);
        process.exit(1);
    }

    try {
        await connectRedis();
    } catch (err) {
        console.error('[server] Redis connection failed:', err.message);
        process.exit(1);
    }

    // ── HTTP server ───────────────────────────────────────────
    app.listen(PORT, () => {
        console.log('[server] ─────────────────────────────────────');
        console.log(`[server] Clarity backend running`);
        console.log(`[server] Environment : ${ENV}`);
        console.log(`[server] Port        : ${PORT}`);
        console.log(`[server] Health      : http://localhost:${PORT}/health`);
        console.log('[server] ─────────────────────────────────────');
    });
}

bootstrap();
