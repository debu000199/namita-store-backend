import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
} from '../controllers/orders.controller.js';
import { authUnifiedMiddleware } from '../middlewares/authUnified.middleware.js';

const userOrderRouter = Router();

// Create a new order (requires authentication)
// userOrderRouter.post("/orders", authUnifiedMiddleware, createOrder);
userOrderRouter.post('/checkout', authUnifiedMiddleware, createOrder);

// Get user's own orders (requires authentication)
// userOrderRouter.get("/orders", authUnifiedMiddleware, getUserOrders);
userOrderRouter.get('/orders', authUnifiedMiddleware, getUserOrders);

export default userOrderRouter;
