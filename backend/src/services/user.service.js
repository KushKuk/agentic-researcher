/**
 * services/user.service.js
 *
 * Centralised, safe user-lookup helpers.
 * All business logic must use getActiveUserOrNull instead of
 * raw prisma.user.findUnique to prevent accidentally serving
 * data for soft-deleted accounts.
 */

import { getPrisma } from '../config/prisma.js';

/**
 * Returns an active (non-deleted) user by ID, or null if not found / deleted.
 *
 * Use this everywhere you need to look up a user by ID.
 * Never call prisma.user.findUnique({ where: { id } }) directly in business logic.
 *
 * @param {string} userId
 * @returns {Promise<import('@prisma/client').User | null>}
 */
export const getActiveUserOrNull = async (userId) => {
    const prisma = getPrisma();
    return prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
    });
};

/**
 * Changes a user's password and increments accountVersion to invalidate
 * all existing sessions globally.
 *
 * Usage (in change-password handler):
 *
 *   await changePassword(userId, newPasswordHash);
 *
 * @param {string} userId
 * @param {string} newPasswordHash  — bcrypt hash of the new password
 */
export const changePassword = async (userId, newPasswordHash) => {
    const prisma = getPrisma();
    return prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newPasswordHash,
                accountVersion: { increment: 1 },  // invalidates all issued JWTs
            },
        }),
        // Wipe all stored refresh tokens — forces re-login on every device
        prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
};

/**
 * Soft-deletes a user account and increments accountVersion to block
 * any tokens that were valid at deletion time.
 *
 * Usage (in delete-account handler):
 *
 *   await softDeleteUser(userId);
 *
 * @param {string} userId
 */
export const softDeleteUser = async (userId) => {
    const prisma = getPrisma();
    return prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                accountVersion: { increment: 1 },  // makes all existing JWTs immediately invalid
            },
        }),
        // Wipe all refresh tokens so the session table stays clean
        prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
};
