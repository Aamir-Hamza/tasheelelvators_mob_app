import { Router } from 'express';
import * as emergencyController from '../controllers/emergencyController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(protect);
router.get('/', emergencyController.list);
router.get('/active', emergencyController.active);
router.post('/', authorize('admin', 'customer'), emergencyController.create);
router.patch('/:id/assign', authorize('admin'), emergencyController.assign);
router.patch('/:id/status', authorize('admin', 'technician'), emergencyController.updateStatus);

export default router;
