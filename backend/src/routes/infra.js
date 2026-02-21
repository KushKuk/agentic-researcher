/**
 * routes/infra.js
 * Temporary infrastructure smoke-test routes.
 * Wired in app.js. Remove or protect before production.
 */

import { Router } from 'express';
import { testDb, testRedis } from '../controllers/infraController.js';

const router = Router();

// GET /test-db    → Prisma SELECT NOW()
router.get('/test-db', testDb);

// GET /test-redis → Redis set + get
router.get('/test-redis', testRedis);

export default router;
