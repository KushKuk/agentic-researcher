/**
 * utils/asyncHandler.js
 * Wraps async route handlers so errors are forwarded to Express's
 * centralised error handler without needing try/catch in every controller.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

/**
 * @param {import('express').RequestHandler} fn  Async route handler
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
