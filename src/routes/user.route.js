import { Router } from 'express';
import { authUnifiedMiddleware } from '../middlewares/authUnified.middleware.js';
import { me } from '../controllers/user.controller.js';

const userRouter = Router();

userRouter.get('/me', authUnifiedMiddleware, me);

export default userRouter;
