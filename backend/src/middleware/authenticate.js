/**
 * middleware/authenticate.js
 * Verifies the JWT access token from the HttpOnly cookie.
 * Fetches user from DB to enforce soft-delete + account version checks.
 * Attaches { id, email } to req.user.
 */

import jwt from 'jsonwebtoken';
import { getPrisma } from '../config/prisma.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

/**
 * Express middleware that guards protected routes.
 *
 * 1. Reads `access_token` cookie → verifies JWT.
 * 2. DB-fetches user to check isDeleted and accountVersion.
 *    - !user            → 401 (account gone)
 *    - user.isDeleted   → 401 + cookie clear
 *    - decoded.v !== accountVersion → 401 + cookie clear (global session invalidation)
 * 3. Attaches req.user = { id, email }
 *
 * @type {import('express').RequestHandler}
 */
export const authenticate = async (req, res, next) => {
    const token = req.cookies?.[ACCESS_COOKIE];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required. No token provided.',
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token. Please log in again.',
        });
    }

    try {
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, email: true, isDeleted: true, accountVersion: true },
        });

        if (!user || user.isDeleted || decoded.v !== user.accountVersion) {
            res.clearCookie(ACCESS_COOKIE);
            res.clearCookie(REFRESH_COOKIE);
            return res.status(401).json({
                status: 'error',
                message: 'Session invalidated. Please log in again.',
            });
        }

        // accountVersion is intentionally NOT forwarded to req.user
        req.user = { id: user.id, email: user.email };
        next();
    } catch {
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};
