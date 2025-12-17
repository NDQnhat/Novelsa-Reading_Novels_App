import { Router } from 'express';
import * as novelController from '../controllers/novelController';
import * as chapterController from '../controllers/chapterController';

const router = Router();

// Novel endpoints
router.get('/', novelController.getNovels);
router.post('/', novelController.createNovel);
router.put('/:id', novelController.updateNovel);
router.delete('/:id', novelController.deleteNovel);

// Chapter endpoints
router.post('/:id/chapters', chapterController.createChapter);
router.put('/:id/chapters/:chapterId', chapterController.updateChapter);
router.delete('/:id/chapters/:chapterId', chapterController.deleteChapter);
router.get('/:id/chapters/:chapterId', chapterController.getChapter);
router.post('/:id/chapters/:chapterId/read', chapterController.incrementReadCount);
router.post('/:id/chapters/:chapterId/like', chapterController.toggleLike);

// Comment endpoints
router.post('/:id/chapters/:chapterId/comments', chapterController.addComment);
router.delete('/:id/chapters/:chapterId/comments/:commentId', chapterController.deleteComment);

export default router;