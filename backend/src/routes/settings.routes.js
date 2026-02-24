/**
 * routes/settings.routes.js
 * Mounts at /api/settings (registered in app entry point).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getProfileController, updateProfileController, getPreferencesController, updatePreferencesController } from '../controllers/settings.controller.js';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// ── Profile ───────────────────────────────────────────────────────────────────

router.get('/profile', getProfileController);
router.patch('/profile', updateProfileController);

// ── Preferences ───────────────────────────────────────────────────────────────

router.get('/preferences', getPreferencesController);
router.patch('/preferences', updatePreferencesController);

export default router;
