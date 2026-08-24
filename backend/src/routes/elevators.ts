import { Router } from 'express';
import * as elevatorController from '../controllers/elevatorController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(protect);
router.get('/', elevatorController.list);
router.get('/stats', elevatorController.stats);
router.get('/:id', elevatorController.getOne);
router.get('/:id/telemetry', elevatorController.telemetry);
router.post('/', authorize('admin'), elevatorController.create);
router.patch('/:id', authorize('admin'), elevatorController.update);
router.delete('/:id', authorize('admin'), elevatorController.remove);
router.patch('/:id/telemetry', authorize('admin', 'technician'), elevatorController.patchTelemetry);

export default router;
