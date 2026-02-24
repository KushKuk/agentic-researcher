/**
 * controllers/settings.controller.js
 * Thin controllers for /api/settings endpoints.
 *
 * Rules:
 *  - No business logic here.
 *  - Always use req.user.id (never req.body.userId).
 *  - Parse + validate input before calling service.
 *  - Prisma/service errors bubble up to errorHandler via asyncHandler.
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { updateProfileSchema, updatePreferencesSchema } from '../validations/settings.validation.js';
import * as settingsService from '../services/settings.service.js';

// ── Shared Zod error formatter ────────────────────────────────────────────────

const formatZodError = (zodError) =>
    zodError.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
    }));

// ── GET /api/settings/profile ─────────────────────────────────────────────────

export const getProfileController = asyncHandler(async (req, res) => {
    const profile = await settingsService.getProfile(req.user.id);

    return res.status(200).json({
        status: 'success',
        data: profile,
    });
});

// ── PATCH /api/settings/profile ───────────────────────────────────────────────

export const updateProfileController = asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid input',
            details: formatZodError(parsed.error),
        });
    }

    const updated = await settingsService.updateProfile(req.user.id, parsed.data);

    return res.status(200).json({
        status: 'success',
        data: updated,
    });
});

// ── GET /api/settings/preferences ────────────────────────────────────────────

export const getPreferencesController = asyncHandler(async (req, res) => {
    const preferences = await settingsService.getPreferences(req.user.id);

    return res.status(200).json({
        status: 'success',
        data: preferences,
    });
});

// ── PATCH /api/settings/preferences ──────────────────────────────────────────

export const updatePreferencesController = asyncHandler(async (req, res) => {
    const parsed = updatePreferencesSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid input',
            details: formatZodError(parsed.error),
        });
    }

    const updated = await settingsService.updatePreferences(req.user.id, parsed.data);

    return res.status(200).json({
        status: 'success',
        data: updated,
    });
});
