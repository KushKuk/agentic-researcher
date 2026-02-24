/**
 * controllers/authController.js
 * Handles user authentication flows.
 *
 * Phase 2:   signup (direct DB) — replaced in Phase 5
 * Phase 3:   login + access token
 * Phase 4:   refresh token rotation, logout
 * Phase 5:   atomic OTP signup (Redis-pending)
 * Phase 6.2: refresh token reuse detection + structured pino security logging
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getPrisma } from '../config/prisma.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── Zod schemas ───────────────────────────────────────────

const signupSchema = z.object({
    fullName: z
        .string({ required_error: 'Full name is required.' })
        .min(2, 'Full name must be at least 2 characters.'),
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, 'Password must be at least 8 characters.'),
});

const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
    password: z
        .string({ required_error: 'Password is required.' })
        .min(8, 'Password must be at least 8 characters.'),
});

const verifyEmailSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
    otp: z
        .string({ required_error: 'OTP is required.' })
        .length(6, 'OTP must be exactly 6 digits.')
        .regex(/^\d{6}$/, 'OTP must contain only digits.'),
});

const resendOtpSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
});

const passwordResetRequestSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
});

const passwordResetSchema = z.object({
    email: z
        .string({ required_error: 'Email is required.' })
        .email('Must be a valid email address.'),
    otp: z
        .string({ required_error: 'OTP is required.' })
        .length(6, 'OTP must be exactly 6 digits.')
        .regex(/^\d{6}$/, 'OTP must contain only digits.'),
    newPassword: z
        .string({ required_error: 'New password is required.' })
        .min(8, 'New password must be at least 8 characters.'),
});

// ── Constants ─────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = 15 * 60;             // 15 min (seconds)
const REFRESH_TOKEN_TTL = 15 * 24 * 60 * 60;   // 15 days (seconds)
const OTP_TTL = 600;                  // 10 min (seconds)
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

// ── Redis key helper ──────────────────────────────────────

const pendingSignupKey = (email) => `signup:${email}`;
const passwordResetKey = (email) => `reset:${email}`;

// ── Auth token helpers ────────────────────────────────────

function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, v: user.accountVersion },
        process.env.JWT_ACCESS_SECRET,
        { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL }
    );
}

function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

function hashToken(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}

/** crypto.randomInt is exclusive of max — gives exactly 6 digits. */
function generateOtp() {
    return String(crypto.randomInt(100000, 1000000));
}

// ── Cookie helpers ────────────────────────────────────────

function setAccessCookie(res, token) {
    res.cookie(ACCESS_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ACCESS_TOKEN_TTL * 1000,
    });
}

function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL * 1000,
    });
}

function clearAuthCookies(res) {
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
}

async function storeRefreshToken(prisma, userId, rawToken) {
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
}

// ── Handlers ──────────────────────────────────────────────

/**
 * POST /auth/signup
 * Stores pending signup in Redis with OTP. Does NOT create DB user yet.
 */
export const signup = asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { fullName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
    });

    if (existing) {
        return res.status(409).json({
            status: 'error',
            message: 'An account with this email already exists.',
        });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const otp = generateOtp();

    const key = pendingSignupKey(normalizedEmail);
    await redis.set(
        key,
        JSON.stringify({ fullName, email: normalizedEmail, passwordHash, otp, createdAt: new Date().toISOString() }),
        { EX: OTP_TTL }
    );

    // Simulate email — replace with real mailer in a future phase
    console.log(`[auth/signup] OTP for ${normalizedEmail}: ${otp}`);

    return res.status(200).json({
        status: 'pending',
        message: 'OTP sent to your email.',
    });
});

/**
 * POST /auth/verify-email
 * Verifies OTP, creates user in DB, deletes Redis key.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { otp } = parsed.data;
    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const key = pendingSignupKey(normalizedEmail);

    const raw = await redis.get(key);
    if (!raw) {
        logger.warn({ event: 'otp_failure', email: normalizedEmail, reason: 'expired_or_not_found' });
        return res.status(400).json({
            status: 'error',
            message: 'OTP expired or invalid. Please sign up again.',
        });
    }

    const pending = JSON.parse(raw);

    if (pending.otp !== otp) {
        logger.warn({ event: 'otp_failure', email: normalizedEmail, reason: 'incorrect_otp' });
        return res.status(400).json({
            status: 'error',
            message: 'Incorrect OTP. Please try again.',
        });
    }

    try {
        const prisma = getPrisma();

        const user = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: { email: normalizedEmail, passwordHash: pending.passwordHash, emailVerified: true },
                select: { id: true },
            });

            await tx.userProfile.create({
                data: { userId: created.id, fullName: pending.fullName },
            });

            await tx.userPreferences.create({
                data: { userId: created.id },
            });

            return created;
        });

        await redis.del(key);

        logger.info({ event: 'otp_success', userId: user.id, email: normalizedEmail });

        return res.status(201).json({
            status: 'success',
            message: 'Email verified. Account created successfully.',
            data: { userId: user.id },
        });
    } catch (err) {
        if (err.code === 'P2002') {
            await redis.del(key).catch(() => { });
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.',
            });
        }
        throw err;
    }
});

/**
 * POST /auth/resend-otp
 * Regenerates OTP, overwrites Redis key, resets TTL.
 */
export const resendOtp = asyncHandler(async (req, res) => {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const key = pendingSignupKey(normalizedEmail);

    const raw = await redis.get(key);
    if (!raw) {
        return res.status(400).json({
            status: 'error',
            message: 'No pending signup found for this email.',
        });
    }

    const pending = JSON.parse(raw);
    const newOtp = generateOtp();
    await redis.set(key, JSON.stringify({ ...pending, otp: newOtp }), { EX: OTP_TTL });

    console.log(`[auth/resend-otp] New OTP for ${normalizedEmail}: ${newOtp}`);

    logger.info({ event: 'otp_resent', email: normalizedEmail });

    return res.status(200).json({
        status: 'success',
        message: 'OTP resent successfully.',
    });
});

/**
 * POST /auth/login
 * Verifies credentials, issues access token + refresh token as HttpOnly cookies.
 */
export const login = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = req.ip;

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, passwordHash: true, isDeleted: true, accountVersion: true },
    });

    if (!user || user.isDeleted) {
        logger.warn({ event: 'login_failure', email: normalizedEmail, ip, reason: 'user_not_found' });
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
        logger.warn({ event: 'login_failure', userId: user.id, email: normalizedEmail, ip, reason: 'wrong_password' });
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email });
    setAccessCookie(res, accessToken);

    const rawRefreshToken = generateRefreshToken();
    await storeRefreshToken(prisma, user.id, rawRefreshToken);
    setRefreshCookie(res, rawRefreshToken);

    logger.info({ event: 'login_success', userId: user.id, email: user.email, ip });

    return res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        data: { userId: user.id, email: user.email },
    });
});

/**
 * POST /auth/refresh
 * Rotates refresh token. Detects token reuse and invalidates all sessions.
 */
export const refresh = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    const ip = req.ip;

    if (!rawToken) {
        return res.status(401).json({ status: 'error', message: 'No refresh token provided.' });
    }

    const tokenHash = hashToken(rawToken);
    const prisma = getPrisma();

    const stored = await prisma.refreshToken.findFirst({
        where: { tokenHash },
        include: { user: { select: { id: true, email: true, isDeleted: true, accountVersion: true } } },
    });

    // ── Reuse detection ─────────────────────────────────────────────────────
    // Token exists in cookie but NOT in DB → it was already rotated (consumed).
    // This signals a potential token theft / replay attack.
    if (!stored) {
        // Attempt to identify the victim user via the (possibly still valid) access token.
        let compromisedUserId = null;

        try {
            const rawAccessToken = req.cookies?.[ACCESS_COOKIE];
            if (rawAccessToken) {
                const decoded = jwt.verify(rawAccessToken, process.env.JWT_ACCESS_SECRET);
                compromisedUserId = decoded.sub;
            }
        } catch {
            // Access token expired or invalid — we can't identify the user; still safe to proceed.
        }

        if (compromisedUserId) {
            // Wipe ALL refresh tokens for this user across every device.
            await prisma.refreshToken.deleteMany({ where: { userId: compromisedUserId } });
            logger.warn({
                event: 'refresh_reuse_detected',
                userId: compromisedUserId,
                ip,
                action: 'all_sessions_invalidated',
            });
        }

        clearAuthCookies(res);
        logger.warn({ event: 'refresh_failure', ip, reason: 'token_not_found_possible_reuse' });
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired session. Please log in again.',
        });
    }

    // ── Expired token ────────────────────────────────────────────────────────
    if (stored.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        clearAuthCookies(res);
        logger.warn({ event: 'refresh_failure', userId: stored.user.id, ip, reason: 'token_expired' });
        return res.status(401).json({
            status: 'error',
            message: 'Session expired. Please log in again.',
        });
    }

    // ── Soft-delete + account version guard ──────────────────────────────────
    // Decode the raw refresh token cookie to extract the embedded version claim.
    // We use the access token's version claim for this check by re-reading it.
    // Since the refresh token itself is an opaque random token (not a JWT),
    // we validate using the stored user's DB accountVersion vs the access token.
    let tokenAccountVersion = null;
    try {
        const rawAccessToken = req.cookies?.access_token;
        if (rawAccessToken) {
            const decoded = jwt.verify(rawAccessToken, process.env.JWT_ACCESS_SECRET, { ignoreExpiration: true });
            tokenAccountVersion = decoded.v ?? null;
        }
    } catch { /* access token may be absent or malformed — proceed to DB check only */ }

    if (
        stored.user.isDeleted ||
        (tokenAccountVersion !== null && tokenAccountVersion !== stored.user.accountVersion)
    ) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        clearAuthCookies(res);
        logger.warn({ event: 'refresh_failure', userId: stored.user.id, ip, reason: stored.user.isDeleted ? 'account_deleted' : 'version_mismatch' });
        return res.status(401).json({
            status: 'error',
            message: 'Session invalidated. Please log in again.',
        });
    }

    // ── Normal rotation ──────────────────────────────────────────────────────
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newRawRefreshToken = generateRefreshToken();
    await storeRefreshToken(prisma, stored.user.id, newRawRefreshToken);

    const newAccessToken = signAccessToken(stored.user);
    setAccessCookie(res, newAccessToken);
    setRefreshCookie(res, newRawRefreshToken);

    logger.info({ event: 'refresh_success', userId: stored.user.id, email: stored.user.email, ip });

    return res.status(200).json({
        status: 'success',
        message: 'Session refreshed.',
        data: { userId: stored.user.id, email: stored.user.email },
    });
});

/**
 * POST /auth/logout
 * Deletes the refresh token from DB and clears both cookies. Idempotent.
 */
export const logout = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    const ip = req.ip;
    let userId = null;

    if (rawToken) {
        const tokenHash = hashToken(rawToken);
        const prisma = getPrisma();

        const stored = await prisma.refreshToken
            .findFirst({ where: { tokenHash }, select: { userId: true } })
            .catch(() => null);

        if (stored?.userId) userId = stored.userId;

        await prisma.refreshToken.deleteMany({ where: { tokenHash } }).catch(() => { });
    }

    clearAuthCookies(res);
    logger.info({ event: 'logout', userId, ip });

    return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.',
    });
});

/**
 * POST /auth/password-reset-request
 *
 * Generates a 6-digit OTP, stores it in Redis (key: reset:<email>), and
 * logs a simulated email. Always returns the same generic response to
 * prevent email enumeration.
 */
export const passwordResetRequest = asyncHandler(async (req, res) => {
    /** Always send this exact response — prevents email enumeration. */
    const genericOk = () =>
        res.status(200).json({
            status: 'success',
            message: 'If an account exists, a reset code has been sent.',
        });

    const parsed = passwordResetRequestSchema.safeParse(req.body);
    if (!parsed.success) return genericOk();

    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const ip = req.ip;

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
    });

    if (!user) {
        logger.info({ event: 'reset_requested', email: normalizedEmail, ip, reason: 'user_not_found' });
        return genericOk();
    }

    const otp = generateOtp();
    const key = passwordResetKey(normalizedEmail);
    await redis.set(
        key,
        JSON.stringify({ userId: user.id, otp, createdAt: new Date().toISOString() }),
        { EX: OTP_TTL }
    );

    // Simulate email dispatch — replace with mail service in a future phase
    console.log(`[auth/password-reset-request] OTP for ${normalizedEmail}: ${otp}`);

    logger.info({ event: 'reset_requested', userId: user.id, email: normalizedEmail, ip });

    return genericOk();
});

/**
 * POST /auth/password-reset
 *
 * Verifies reset OTP, updates passwordHash, wipes all refresh tokens
 * (global session invalidation), and deletes the Redis key.
 *
 * Body: { email, otp, newPassword }
 */
export const passwordReset = asyncHandler(async (req, res) => {
    const parsed = passwordResetSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { otp, newPassword } = parsed.data;
    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const ip = req.ip;
    const key = passwordResetKey(normalizedEmail);

    // ── 1. Fetch pending reset from Redis ───────────────────
    const raw = await redis.get(key);
    if (!raw) {
        logger.warn({ event: 'reset_failed_expired', email: normalizedEmail, ip });
        return res.status(400).json({
            status: 'error',
            message: 'Invalid or expired reset code.',
        });
    }

    const stored = JSON.parse(raw);

    // ── 2. Verify OTP ───────────────────────────────────────
    if (stored.otp !== otp) {
        logger.warn({ event: 'reset_failed_invalid_otp', userId: stored.userId, email: normalizedEmail, ip });
        return res.status(400).json({
            status: 'error',
            message: 'Invalid or expired reset code.',
        });
    }

    // ── 3. Hash new password ────────────────────────────────
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // ── 4. Update DB + wipe all sessions ───────────────────
    const prisma = getPrisma();
    await prisma.$transaction([
        prisma.user.update({
            where: { id: stored.userId },
            data: {
                passwordHash,
                accountVersion: { increment: 1 },   // invalidates all issued JWTs
            },
        }),
        prisma.refreshToken.deleteMany({
            where: { userId: stored.userId },
        }),
    ]);

    // ── 5. Clean up Redis key ───────────────────────────────
    await redis.del(key);

    logger.info({ event: 'password_reset_success', userId: stored.userId, email: normalizedEmail, ip });

    return res.status(200).json({
        status: 'success',
        message: 'Password reset successfully. Please log in again.',
    });
});

/**
 * GET /auth/me
 * Returns the current authenticated user, or null if no valid session exists.
 * Returns 200 OK even if unauthenticated to prevent browser console 401 error noise on initial load.
 */
export const getMe = asyncHandler(async (req, res) => {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
        return res.status(200).json({ status: 'success', data: { user: null } });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, email: true, isDeleted: true, accountVersion: true }
        });

        if (!user || user.isDeleted || decoded.v !== user.accountVersion) {
            return res.status(200).json({ status: 'success', data: { user: null } });
        }

        return res.status(200).json({
            status: 'success',
            data: { user: { id: user.id, email: user.email } }
        });
    } catch {
        return res.status(200).json({ status: 'success', data: { user: null } });
    }
});
