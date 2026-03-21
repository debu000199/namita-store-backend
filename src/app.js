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
import { getSpeedInsightsScript } from './config/speedInsights.config.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:8080', 'https://eplatform-app.vercel.app', '*'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  // Serve HTML page with Speed Insights integration
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Namita Store Backend API</title>
      ${getSpeedInsightsScript()}
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        .status {
          background: rgba(255, 255, 255, 0.2);
          padding: 1rem 2rem;
          border-radius: 8px;
          margin-top: 2rem;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Namita Store Backend API</h1>
        <p>Welcome to the backend API server</p>
        <div class="status">
          <strong>Status:</strong> Running ✅
        </div>
      </div>
    </body>
    </html>
  `;
  res.status(200).send(html);
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
