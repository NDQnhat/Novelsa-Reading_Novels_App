import { Router } from 'express';
import * as novelController from '../controllers/novelController';

const router = Router();

router.get('/', novelController.getNovels);
router.post('/', novelController.createNovel);
router.put('/:id', novelController.updateNovel);
router.delete('/:id', novelController.deleteNovel);

export default router;