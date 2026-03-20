import { track } from '@vercel/analytics/server';

/**
 * Track custom events with Vercel Analytics
 * @param {string} eventName - The name of the event to track
 * @param {Object} data - Optional event data (max 255 chars per key/value)
 * @returns {Promise<void>}
 */
export const trackEvent = async (eventName, data = {}) => {
  try {
    // Only track events in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ANALYTICS_ENABLED === 'true') {
      await track(eventName, data);
    }
  } catch (error) {
    // Silently fail to avoid disrupting application flow
    console.error('Analytics tracking error:', error);
  }
};

export { track };
