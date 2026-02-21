/**
 * utils/logger.js
 * Shared pino logger instance.
 *
 * Development: human-readable output via pino-pretty.
 * Production : structured JSON — pipe to log aggregator (Datadog, Loki, etc.).
 *
 * Usage:
 *   import logger from '../utils/logger.js';
 *   logger.info({ event: 'login_success', userId, ip: req.ip });
 *   logger.warn({ event: 'refresh_reuse_detected', userId });
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
    {
        level: isDev ? 'debug' : 'info',
        // Redact any field that should never appear in logs, regardless of call site.
        redact: {
            paths: ['password', 'passwordHash', 'otp', 'token', 'refreshToken', 'tokenHash'],
            censor: '[REDACTED]',
        },
    },
    isDev
        ? pino.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
            },
        })
        : undefined // production: write structured JSON to stdout
);

export default logger;
