import { Router } from 'express';
import {
  categories,
  products,
  slugView,
} from '../controllers/products.controller.js';

// This route only for customer (admin), Where then only see the all products and single product
const userProductRoute = Router();

// Return the all product to the User/Customer
userProductRoute.get('/products', products);

// Return by categories
userProductRoute.get('/categories', categories);

// Return a particuler product
userProductRoute.get('/products/:slug', slugView);

export default userProductRoute;
