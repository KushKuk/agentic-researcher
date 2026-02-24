/**
 * services/settings.service.js
 * Business logic for /api/settings endpoints.
 *
 * Rules:
 *  - No access to req / res.
 *  - Uses getActiveUserOrNull for all user lookups (soft-delete safe).
 *  - Never passes raw req.body to Prisma.
 *  - Never updates the User table from profile operations.
 */

import { getPrisma } from '../config/prisma.js';
import { getActiveUserOrNull } from './user.service.js';

// ── Shared 404 thrower ────────────────────────────────────────────────────────

function notFound(msg = 'Profile not found.') {
    const err = new Error(msg);
    err.statusCode = 404;
    throw err;
}

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Retrieves the active user's profile.
 * Returns { email, fullName, institution, domain, role }.
 *
 * Throws 404 if the user is not found or is soft-deleted.
 *
 * @param {string} userId
 */
export const getProfile = async (userId) => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
        include: { profile: true },
    });

    if (!user || !user.profile) notFound('Profile not found.');

    return {
        email: user.email,
        fullName: user.profile.fullName,
        institution: user.profile.institution,
        domain: user.profile.domain,
        role: user.profile.role,
    };
};

/**
 * Updates the active user's UserProfile row.
 * Only updates the UserProfile table — never touches User.
 * Accepts only the fields allowed by updateProfileSchema.
 *
 * @param {string} userId
 * @param {{ fullName: string, institution?: string, domain?: string, role?: string }} validatedData
 */
export const updateProfile = async (userId, validatedData) => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
        select: { id: true },
    });
    if (!user) notFound('User not found.');

    // Build update payload from only the keys the client explicitly sent.
    // Omitted keys are NOT included — their DB values remain unchanged.
    const updateData = {};
    if ('fullName' in validatedData) updateData.fullName = validatedData.fullName;
    if ('institution' in validatedData) updateData.institution = validatedData.institution;
    if ('domain' in validatedData) updateData.domain = validatedData.domain;
    if ('role' in validatedData) updateData.role = validatedData.role;

    const updated = await prisma.userProfile.update({
        where: { userId },
        data: updateData,
        select: {
            fullName: true,
            institution: true,
            domain: true,
            role: true,
        },
    });

    return updated;
};

// ── Preferences ───────────────────────────────────────────────────────────────

/**
 * Retrieves the active user's research preferences.
 * Returns { paperCount, timeRange, databases: { arxiv, pubmed, ieee, googleScholar } }.
 *
 * @param {string} userId
 */
export const getPreferences = async (userId) => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
        include: { preferences: true },
    });

    if (!user || !user.preferences) notFound('Preferences not found.');

    const p = user.preferences;
    return {
        paperCount: p.paperCount,
        timeRange: p.timeRange,
        databases: {
            arxiv: p.arxiv,
            pubmed: p.pubmed,
            ieee: p.ieee,
            googleScholar: p.googleScholar,
        },
    };
};

/**
 * Updates the active user's UserPreferences row.
 * Only writes to UserPreferences — never touches User or UserProfile.
 *
 * @param {string} userId
 * @param {{ paperCount: number, timeRange: string, databases: object }} validatedData
 */
export const updatePreferences = async (userId, validatedData) => {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
        where: { id: userId, isDeleted: false },
        select: { id: true },
    });
    if (!user) notFound('User not found.');

    const { paperCount, timeRange, databases } = validatedData;

    // Build flat updateData — never spread raw body into Prisma
    const updateData = {
        paperCount,
        timeRange,
        arxiv: databases.arxiv,
        pubmed: databases.pubmed,
        ieee: databases.ieee,
        googleScholar: databases.googleScholar,
    };

    const updated = await prisma.userPreferences.update({
        where: { userId },
        data: updateData,
        select: {
            paperCount: true,
            timeRange: true,
            arxiv: true,
            pubmed: true,
            ieee: true,
            googleScholar: true,
        },
    });

    return {
        paperCount: updated.paperCount,
        timeRange: updated.timeRange,
        databases: {
            arxiv: updated.arxiv,
            pubmed: updated.pubmed,
            ieee: updated.ieee,
            googleScholar: updated.googleScholar,
        },
    };
};
