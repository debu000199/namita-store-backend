# Vercel Web Analytics Configuration

This project has been configured with Vercel Web Analytics for server-side tracking.

## Overview

Vercel Web Analytics is now integrated into this Express backend API to track:
- API endpoint requests (method, path, status code, duration)
- Custom events in routes and controllers

## Automatic Tracking

The analytics middleware automatically tracks all API requests with the following information:
- HTTP method (GET, POST, PUT, DELETE, etc.)
- Request path
- Response status code
- Request duration in milliseconds

## Custom Event Tracking

You can track custom events in your routes and controllers by importing the `trackEvent` function:

```javascript
import { trackEvent } from '../config/analytics.config.js';

// Example: Track a custom event
await trackEvent('User Login', {
  userId: user.id,
  email: user.email,
});

// Example: Track an order creation
await trackEvent('Order Created', {
  orderId: order.id,
  total: order.total.toString(),
  items: order.items.length.toString(),
});
```

### Important Notes

1. **Event Name**: Maximum 255 characters
2. **Data Keys/Values**: Maximum 255 characters each
3. **Supported Types**: strings, numbers, booleans, null (no nested objects)
4. **Availability**: Custom event tracking is available for Vercel Pro and Enterprise users
5. **Environment**: Events are only tracked in production or when `VERCEL_ANALYTICS_ENABLED=true` is set

## Environment Variables

- `NODE_ENV=production` - Enables analytics tracking in production
- `VERCEL_ANALYTICS_ENABLED=true` - Enables analytics tracking in development (optional)
- `VERCEL_WEB_ANALYTICS_DISABLE_LOGS=true` - Disables debug logs for server-side events (optional)

## Vercel Dashboard Setup

To view your analytics data:

1. Log in to your Vercel dashboard
2. Navigate to your project
3. Click on the "Analytics" tab
4. Enable Web Analytics if not already enabled

Analytics data will appear after you deploy your application to Vercel.

## Documentation

- [Vercel Web Analytics Quickstart](https://vercel.com/docs/analytics/quickstart)
- [Custom Events Documentation](https://vercel.com/docs/analytics/custom-events)
- [Analytics Package Documentation](https://vercel.com/docs/analytics/package)
