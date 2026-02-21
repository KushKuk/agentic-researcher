/**
 * middleware/authenticate.js
 * Verifies the JWT access token from the HttpOnly cookie.
 * Attaches the decoded payload to req.user.
 *
 * Does NOT query the database — purely stateless token verification.
 */

import jwt from 'jsonwebtoken';

/**
 * Express middleware that guards protected routes.
 *
 * Reads `access_token` cookie → verifies JWT → attaches req.user.
 * Returns 401 on missing, invalid, or expired token.
 *
 * @type {import('express').RequestHandler}
 */
export const authenticate = (req, res, next) => {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required. No token provided.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Attach a clean user object — only what downstream handlers need
        req.user = {
            id: decoded.sub,
            email: decoded.email,
        };

        next();
    } catch (err) {
        // Covers TokenExpiredError, JsonWebTokenError, NotBeforeError
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token. Please log in again.',
        });
    }
};
