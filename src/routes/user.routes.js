import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware); // all routes below require authentication

router.get('/me', getMe);
router.put('/me', updateMe);

export default router;