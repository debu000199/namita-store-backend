import { Router } from 'express';
import {
  orderById,
  orders,
  updateOrderStatusById,
} from '../../controllers/admin/orders.controller.js';

const adminOrderRouter = Router();

// Display the all Customer orders
adminOrderRouter.get('/orders', orders);

// TODO: implement single-order handler in controller and hook here
adminOrderRouter.get('/orders/:orderId', orderById);

adminOrderRouter.put('/orders/:orderId', updateOrderStatusById);

export default adminOrderRouter;
