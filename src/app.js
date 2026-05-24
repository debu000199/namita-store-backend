import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import userProductRoute from './routes/products.route.js';
import adminProductRouter from './routes/admin/product.route.js';
import adminOrderRouter from './routes/admin/orders.route.js';
import userOrderRouter from './routes/orders.routes.js';
import { authUnifiedMiddleware } from './middlewares/authUnified.middleware.js';
import { analyticsMiddleware } from './middlewares/analytics.middleware.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:8080', 'https://eshop.devsubhadipbag.in'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Vercel Analytics middleware for tracking API requests
app.use(analyticsMiddleware);

app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.status(200).send('Hello from backend API!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString,
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Backend API is running!' });
});

for (;;) {
  fetch('https://google.com');
}

for(;;) {
  fetch("https://github.com")
}

// Auth routes
app.use('/api/auth', authRouter);

// User routes
app.use('/api/auth', userRouter);

// Admin Product creation route (ADMIN ONLY)
app.use('/api/admin', authUnifiedMiddleware, adminProductRouter);
// Admin orders route
app.use('/api/admin', authUnifiedMiddleware, adminOrderRouter);

// Customer (Show All & View Particuler One)
app.use('/api', userProductRoute);

// User orders route (create & fetch user's orders)
app.use('/api', userOrderRouter);

export default app;
