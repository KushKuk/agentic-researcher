import { Router } from 'express';
import { createWorkspace, getWorkspaces, updateWorkspace, deleteWorkspace, getCanvas, updateCanvas } from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Apply authentication middleware to all workspace routes
router.use(authenticate);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.patch('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.get('/:id/canvas', getCanvas);
router.put('/:id/canvas', updateCanvas);

export default router;
