import { getPrisma } from '../config/prisma.js';

/**
 * Creates a Workspace and strictly 1:1 Canvas in a single transaction.
 */
export const createWorkspaceWithCanvas = async (userId, data) => {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
            data: {
                userId,
                name: data.name,
                description: data.description ?? null,
            },
        });

        await tx.canvas.create({
            data: {
                workspaceId: workspace.id,
                nodesJson: [],
                edgesJson: [],
                version: 1,
            },
        });

        return workspace;
    });
};

/**
 * Gets active (non-deleted) workspaces for a user, ordered by updatedAt DESC.
 */
export const getWorkspaces = async (userId) => {
    const prisma = getPrisma();
    return prisma.workspace.findMany({
        where: { userId, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

/**
 * Gets a workspace by ID (internal use only — returns raw row including userId).
 */
export const getWorkspaceById = async (id) => {
    const prisma = getPrisma();
    return prisma.workspace.findUnique({ where: { id } });
};

/**
 * Finds an active workspace by id and userId.
 * Throws a 404-shaped error if not found, deleted, or owned by another user.
 * Never leaks whether the workspace exists.
 */
export const getWorkspaceOrThrow = async (id, userId) => {
    const prisma = getPrisma();
    const workspace = await prisma.workspace.findFirst({
        where: { id, userId, isDeleted: false },
    });
    if (!workspace) {
        const err = new Error('Workspace not found.');
        err.statusCode = 404;
        throw err;
    }
    return workspace;
};

/**
 * Updates a workspace by ID.
 */
export const updateWorkspace = async (id, data) => {
    const prisma = getPrisma();
    return prisma.workspace.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

/**
 * Soft-deletes a workspace by ID.
 */
export const deleteWorkspace = async (id) => {
    const prisma = getPrisma();
    return prisma.workspace.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
    });
};

/**
 * Gets a canvas by workspace ID.
 */
export const getCanvasByWorkspaceId = async (workspaceId) => {
    const prisma = getPrisma();
    return prisma.canvas.findUnique({
        where: { workspaceId },
        select: {
            nodesJson: true,
            edgesJson: true,
            version: true,
            nodeCount: true,
            edgeCount: true,
            lastModifiedBy: true,
            updatedAt: true,
        },
    });
};

/**
 * Validates node and edge structural integrity.
 * Returns null if valid, or an error string if invalid.
 */
const validateCanvasStructure = (nodes, edges) => {
    // Node validation
    const nodeIds = new Set();
    for (const node of nodes) {
        if (typeof node.id !== 'string') return 'invalid';
        if (nodeIds.has(node.id)) return 'invalid';
        nodeIds.add(node.id);
    }

    // Edge validation
    for (const edge of edges) {
        if (typeof edge.id !== 'string') return 'invalid';
        if (typeof edge.source !== 'string') return 'invalid';
        if (typeof edge.target !== 'string') return 'invalid';
        if (!nodeIds.has(edge.source)) return 'invalid';
        if (!nodeIds.has(edge.target)) return 'invalid';
    }

    return null;
};

/**
 * Atomically updates a canvas only when workspaceId AND version match.
 * Returns { count: 1 } on success, { count: 0 } on version conflict.
 * Returns { error: true } on structural validation failure.
 */
export const updateCanvasByWorkspaceId = async (workspaceId, data, clientVersion, userId) => {
    const validationError = validateCanvasStructure(data.nodes, data.edges);
    if (validationError) {
        return { error: true };
    }

    const prisma = getPrisma();
    return prisma.canvas.updateMany({
        where: {
            workspaceId,
            version: clientVersion,
        },
        data: {
            nodesJson: data.nodes,
            edgesJson: data.edges,
            nodeCount: data.nodes.length,
            edgeCount: data.edges.length,
            lastModifiedBy: userId,
            version: { increment: 1 },
        },
    });
};
