/**
 * controllers/infraController.js
 * Temporary smoke-test handlers for Prisma and Redis connectivity.
 * These routes are ONLY for infrastructure verification during development.
 * Remove or gate behind an admin auth guard before production.
 */

import getPrisma from '../config/prisma.js';
import redis from '../config/redis.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /test-db
 * Runs a raw SELECT NOW() and returns the database server timestamp.
 */
export const testDb = asyncHandler(async (_req, res) => {
    const prisma = getPrisma();
    const result = await prisma.$queryRaw`SELECT NOW() AS now`;
    res.status(200).json({
        status: 'ok',
        database: 'postgresql',
        timestamp: result[0].now,
    });
});

/**
 * GET /test-redis
 * Sets a key, reads it back, and returns the value.
 */
export const testRedis = asyncHandler(async (_req, res) => {
    await redis.set('infra_test', 'working', { EX: 60 });
    const value = await redis.get('infra_test');
    res.status(200).json({
        status: 'ok',
        cache: 'redis',
        value,
    });
});
