/**
 * config/index.js
 * Central place for all application configuration.
 * Will grow in future phases (DB URIs, Redis config, JWT secrets, etc.).
 * Reads from process.env — call this AFTER dotenv has loaded in server.js.
 */

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
