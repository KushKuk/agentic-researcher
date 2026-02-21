/**
 * middleware/errorHandler.js
 * Centralised error-handling middleware.
 *
 *  notFound   – catches requests that fell through all routes (404)
 *  errorHandler – final error handler; formats and sends the response
 */

/**
 * 404 catch-all.
 * Mount AFTER all route definitions to catch unmatched requests.
 *
 * @type {import('express').RequestHandler}
 */
export const notFound = (req, res, next) => {
    const err = new Error(`Not found — ${req.method} ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
};

/**
 * Global error handler.
 * Express identifies this as an error handler via the 4-argument signature.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode ?? 500;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        // Only expose the stack trace outside of production
        ...(isProduction ? {} : { stack: err.stack }),
    });
};
