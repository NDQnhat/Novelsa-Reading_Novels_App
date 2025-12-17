import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/users/:id', authController.updateUser);
router.post('/users/:id/library/:novelId', authController.addToLibrary);
router.delete('/users/:id/library/:novelId', authController.removeFromLibrary);

export default router;