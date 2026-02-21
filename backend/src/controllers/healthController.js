/**
 * controllers/healthController.js
 * Handler for the /health endpoint.
 */

/**
 * GET /health
 * Returns application status and current environment.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const getHealth = (_req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV,
    });
};
