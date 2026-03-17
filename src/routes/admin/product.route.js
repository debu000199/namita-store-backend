import { Router } from 'express';
import {
  create,
  createCategory,
  dashboard,
  deleteProduct,
  editProduct,
} from '../../controllers/admin/products.controller.js';

const adminProductRouter = Router();

adminProductRouter.get('/products', dashboard);

adminProductRouter.post('/products', create);

adminProductRouter.post('/categories', createCategory);

adminProductRouter.put('/products/:productId', editProduct);

adminProductRouter.delete('/products/:productId', deleteProduct);

export default adminProductRouter;
