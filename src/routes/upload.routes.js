import { Router } from 'express';
import { uploadImage, listImages, deleteImage } from '../controllers/upload.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import uploadMiddleware from '../middlewares/upload.middleware.js';

const router = Router();

router.use(authMiddleware); // all routes below require authentication

router.post('/', uploadMiddleware.single('image'), uploadImage);
router.get('/', listImages);
router.delete('/:id', deleteImage);

export default router;