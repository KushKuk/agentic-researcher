/**
 * config/prisma.js
 * Single shared PrismaClient instance using the Prisma v7 driver-adapter pattern.
 *
 * PrismaPg constructor signature: PrismaPg(poolOrConfig: pg.Pool | pg.PoolConfig)
 * We pass the Pool instance directly — NOT wrapped in an object.
 *
 * The Pool is constructed inside connectPrisma() so DATABASE_URL is guaranteed
 * to be in process.env before the Pool reads it.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prisma;

/**
 * Creates the pg Pool, wires the Prisma adapter, and verifies connectivity.
 * Must be the FIRST async call in server.js bootstrap.
 * Throws on failure so the caller can log and exit.
 */
export async function connectPrisma() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

    // Pass the Pool instance directly — PrismaPg(pool), NOT PrismaPg({ pool })
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    console.log('[prisma] Connected to PostgreSQL');
}

/**
 * Returns the initialised PrismaClient.
 * Throws a clear error if called before connectPrisma().
 */
export function getPrisma() {
    if (!prisma) {
        throw new Error('[prisma] Not initialised — call connectPrisma() first.');
    }
    return prisma;
}

export default getPrisma;
