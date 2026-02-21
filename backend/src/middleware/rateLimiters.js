/**
 * middleware/rateLimiters.js
 * Configured express-rate-limit instances for sensitive auth routes.
 * Applied per-route in routes/auth.js — not globally.
 *
 * All limiters return JSON (never the default HTML page).
 */

import { rateLimit } from 'express-rate-limit';

/** Shared JSON handler for all rate-limit responses. */
const rateLimitHandler = (_req, res) => {
    res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.',
    });
};

/**
 * POST /auth/login
 * 5 attempts per minute — protects against credential stuffing.
 */
export const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/signup
 * 5 per minute — prevents account creation spam.
 */
export const signupLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/verify-email
 * 5 per 10 minutes — limits OTP brute-force attempts.
 */
export const verifyOtpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/resend-otp
 * 3 per 10 minutes — prevents OTP flooding.
 */
export const resendOtpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/refresh
 * 10 per minute — generous for multi-tab usage, still protects token hammering.
 */
export const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/password-reset-request
 * 5 per minute — prevents enumeration probing.
 */
export const passwordResetRequestLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * POST /auth/password-reset
 * 5 per 10 minutes — limits OTP brute-force on reset codes.
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitHandler,
});
