/**
 * routes/health.js
 * Simple health-check route.
 * Useful for load balancers, uptime monitors, and CI smoke tests.
 */

import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

// GET /health
router.get('/', getHealth);

export default router;
