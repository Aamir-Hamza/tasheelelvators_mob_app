import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenanceController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(protect);
router.get('/', maintenanceController.list);
router.get('/stats', maintenanceController.stats);
router.get('/:id', maintenanceController.getOne);
router.post('/', authorize('admin'), maintenanceController.create);
router.patch('/:id/start', authorize('admin', 'technician'), maintenanceController.start);
router.patch('/:id/checklist', authorize('admin', 'technician'), maintenanceController.checklist);
router.patch('/:id/signoff', authorize('admin', 'technician'), maintenanceController.signOff);

export default router;
