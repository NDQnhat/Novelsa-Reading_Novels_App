import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

// User management endpoints
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/ban', adminController.banUser);

// Novel management endpoints
router.get('/novels/all', adminController.getAllNovels);
router.get('/novels', adminController.getNovelsByStatus);
router.post('/novels/:id/approve', adminController.approveNovel);
router.post('/novels/:id/reject', adminController.rejectNovel);
router.delete('/novels/:id', adminController.deleteNovel);

export default router;
