import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as workspaceService from '../services/workspace.service.js';

const createWorkspaceSchema = z.object({
    name: z
        .string({ required_error: 'Name is required.' })
        .trim()
        .min(2, 'Name must be at least 2 characters.')
        .max(100, 'Name must be at most 100 characters.'),
    description: z.string().trim().optional(),
});

export const createWorkspace = asyncHandler(async (req, res) => {
    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { name, description } = parsed.data;
    const userId = req.user.id;

    try {
        const workspace = await workspaceService.createWorkspaceWithCanvas(userId, { name, description });

        return res.status(201).json({
            status: 'success',
            data: {
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
            },
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'Workspace name already exists.',
            });
        }
        throw error;
    }
});

export const getWorkspaces = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const workspaces = await workspaceService.getWorkspaces(userId);

    return res.status(200).json({
        status: 'success',
        data: workspaces,
    });
});

const updateWorkspaceSchema = z.object({
    name: z
        .string({ required_error: 'Name is required.' })
        .trim()
        .min(1, 'Name must not be empty.')
        .max(100, 'Name must be at most 100 characters.'),
});

export const updateWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const parsed = updateWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { name } = parsed.data;

    // Ownership + existence + soft-delete check (throws 404 on failure)
    await workspaceService.getWorkspaceOrThrow(id, userId);

    try {
        const updated = await workspaceService.updateWorkspace(id, { name });
        return res.status(200).json({
            status: 'success',
            data: {
                name: updated.name,
                updatedAt: updated.updatedAt,
            },
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'Workspace name already exists.',
            });
        }
        throw error;
    }
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Ownership + existence + soft-delete check (throws 404 on failure)
    await workspaceService.getWorkspaceOrThrow(id, userId);
    await workspaceService.deleteWorkspace(id);

    return res.status(204).send();
});

export const getCanvas = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const workspace = await workspaceService.getWorkspaceById(id);
    if (!workspace) {
        return res.status(404).json({
            status: 'error',
            message: 'Workspace not found.',
        });
    }

    if (workspace.userId !== userId) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden.',
        });
    }

    const canvas = await workspaceService.getCanvasByWorkspaceId(id);
    if (!canvas) {
        return res.status(500).json({
            status: 'error',
            message: 'Canvas integrity error.',
        });
    }

    return res.status(200).json({
        status: 'success',
        data: {
            nodes: canvas.nodesJson,
            edges: canvas.edgesJson,
            version: canvas.version,
        },
        metadata: {
            nodeCount: canvas.nodeCount,
            edgeCount: canvas.edgeCount,
            lastModifiedBy: canvas.lastModifiedBy,
            updatedAt: canvas.updatedAt,
        },
    });
});

const updateCanvasSchema = z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    version: z.number().int().min(1),
});

export const updateCanvas = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate input
    const parsed = updateCanvasSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed.',
            errors: parsed.error.flatten().fieldErrors,
        });
    }

    const { nodes, edges, version } = parsed.data;

    // Verify workspace exists
    const workspace = await workspaceService.getWorkspaceById(id);
    if (!workspace) {
        return res.status(404).json({
            status: 'error',
            message: 'Workspace not found.',
        });
    }

    // Verify ownership
    if (workspace.userId !== userId) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden.',
        });
    }

    // Atomic optimistic lock: version check + write happen in one DB operation
    const result = await workspaceService.updateCanvasByWorkspaceId(id, { nodes, edges }, version, userId);

    // Structural validation failed in service layer
    if (result.error) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid canvas structure.',
        });
    }

    if (result.count === 0) {
        // Version mismatch — fetch latest state to return to client
        const currentCanvas = await workspaceService.getCanvasByWorkspaceId(id);

        if (!currentCanvas) {
            return res.status(500).json({
                status: 'error',
                message: 'Canvas integrity error.',
            });
        }

        return res.status(409).json({
            status: 'error',
            code: 'VERSION_CONFLICT',
            data: {
                nodes: currentCanvas.nodesJson,
                edges: currentCanvas.edgesJson,
                version: currentCanvas.version,
            },
        });
    }

    // count === 1: fetch the now-updated canvas to return
    const updatedCanvas = await workspaceService.getCanvasByWorkspaceId(id);

    return res.status(200).json({
        status: 'success',
        data: {
            nodes: updatedCanvas.nodesJson,
            edges: updatedCanvas.edgesJson,
            version: updatedCanvas.version,
        },
    });
});
