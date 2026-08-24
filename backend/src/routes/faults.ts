import { Router } from 'express';
import * as faultController from '../controllers/faultController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(protect);
router.get('/', faultController.list);
router.get('/:id', faultController.getOne);
router.post('/', authorize('admin', 'customer'), faultController.create);
router.patch('/:id/assign', authorize('admin'), faultController.assign);
router.patch('/:id/status', authorize('admin', 'technician'), faultController.updateStatus);

export default router;
