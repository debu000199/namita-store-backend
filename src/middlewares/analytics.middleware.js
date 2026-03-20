import { trackEvent } from '../config/analytics.config.js';

/**
 * Middleware to track API requests with Vercel Analytics
 * Tracks page views and endpoint hits
 */
export const analyticsMiddleware = (req, res, next) => {
  // Track the request path and method
  const startTime = Date.now();
  
  // Listen for response finish to track completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Track API endpoint access
    trackEvent('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode.toString(),
      duration: duration.toString(),
    }).catch(() => {
      // Errors are already logged in trackEvent
    });
  });
  
  next();
};
