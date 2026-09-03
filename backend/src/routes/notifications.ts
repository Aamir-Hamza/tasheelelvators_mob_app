import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'technician'));
router.get('/', notificationController.list);
router.get('/unread', notificationController.unread);
router.patch('/read-all', notificationController.readAll);
router.patch('/:id/read', notificationController.readOne);

export default router;
