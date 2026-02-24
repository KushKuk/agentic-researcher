/**
 * validations/settings.validation.js
 * Zod schemas for the /api/settings routes.
 */

import { z } from 'zod';

export const updateProfileSchema = z
    .object({
        fullName: z
            .string({ required_error: 'Full name is required.' })
            .trim()
            .min(1, 'Full name must not be empty.')
            .max(100, 'Full name must be at most 100 characters.'),

        institution: z
            .string()
            .trim()
            .max(150, 'Institution must be at most 150 characters.')
            .nullable()
            .optional(),

        domain: z
            .string()
            .trim()
            .max(100, 'Domain must be at most 100 characters.')
            .nullable()
            .optional(),

        role: z
            .enum(['Student', 'Researcher', 'Professor', 'Industry', 'Other'], {
                errorMap: () => ({ message: 'Role must be one of: Student, Researcher, Professor, Industry, Other.' }),
            })
            .nullable()
            .optional(),
    })
    .strict(); // rejects unknown keys

export const updatePreferencesSchema = z
    .object({
        paperCount: z.union(
            [z.literal(3), z.literal(5), z.literal(10), z.literal(20)],
            { errorMap: () => ({ message: 'paperCount must be exactly 3, 5, 10, or 20.' }) }
        ),

        timeRange: z.enum(['1y', '3y', '5y', 'all'], {
            errorMap: () => ({ message: 'timeRange must be one of: "1y", "3y", "5y", "all".' }),
        }),

        databases: z
            .object({
                arxiv: z.boolean({ required_error: 'arxiv must be a boolean.' }),
                pubmed: z.boolean({ required_error: 'pubmed must be a boolean.' }),
                ieee: z.boolean({ required_error: 'ieee must be a boolean.' }),
                googleScholar: z.boolean({ required_error: 'googleScholar must be a boolean.' }),
            })
            .strict(), // rejects unknown database flags
    })
    .strict(); // rejects unknown top-level keys
