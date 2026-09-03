import { Router } from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.post('/login', authController.login);
router.post('/register-user', authController.registerUser);
router.post('/register', protect, authorize('admin'), authController.register);
router.get('/me', protect, authController.me);
router.post('/push-token', protect, authController.savePushToken);
router.get('/technicians', protect, authController.technicians);
router.get('/users', protect, authorize('admin'), authController.users);

export default router;
