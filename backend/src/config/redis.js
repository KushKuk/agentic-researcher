/**
 * config/redis.js
 * Single shared Redis client instance.
 * Import `redis` wherever you need cache/pub-sub access.
 */

import { createClient } from 'redis';

const redis = createClient({
    url: process.env.REDIS_URL,
});

// Surface connection errors without crashing the process mid-flight
redis.on('error', (err) => {
    console.error('[redis] Client error:', err.message);
});

/**
 * Connects the Redis client and verifies it is reachable.
 * Called once at server startup — exits the process if it fails.
 */
export async function connectRedis() {
    await redis.connect();
    console.log('[redis] Connected');
}

export default redis;
