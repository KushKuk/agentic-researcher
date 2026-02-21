/**
 * routes/auth.js
 * Authentication routes — mounted at /auth in app.js.
 *
 * Phase 2:   POST /auth/signup
 * Phase 3:   POST /auth/login, GET /auth/me
 * Phase 4:   POST /auth/refresh, POST /auth/logout
 * Phase 5:   POST /auth/verify-email, POST /auth/resend-otp
 * Phase 6.1: rate limiting applied to all sensitive routes
 * Phase 6.3: POST /auth/password-reset-request, POST /auth/password-reset
 */

import { Router } from 'express';
import {
    signup,
    verifyEmail,
    resendOtp,
    login,
    refresh,
    logout,
    passwordResetRequest,
    passwordReset,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import {
    loginLimiter,
    signupLimiter,
    verifyOtpLimiter,
    resendOtpLimiter,
    refreshLimiter,
    passwordResetRequestLimiter,
    passwordResetLimiter,
} from '../middleware/rateLimiters.js';

const router = Router();

// ── Signup flow ───────────────────────────────────────────
router.post('/signup', signupLimiter, signup);
router.post('/verify-email', verifyOtpLimiter, verifyEmail);
router.post('/resend-otp', resendOtpLimiter, resendOtp);

// ── Session management ────────────────────────────────────
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);                       // no limit — idempotent

// ── Password reset ────────────────────────────────────────
router.post('/password-reset-request', passwordResetRequestLimiter, passwordResetRequest);
router.post('/password-reset', passwordResetLimiter, passwordReset);

// ── Protected ─────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: { user: req.user },
    });
});

export default router;
