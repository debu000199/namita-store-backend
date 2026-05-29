import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Initialize Vercel Speed Insights
 * This should be called in any route that serves HTML content
 * For API-only backends, Speed Insights is primarily useful for
 * frontend clients consuming the API.
 */
export const initializeSpeedInsights = (options = {}) => {
  try {
    // Only inject in production or if explicitly enabled
    const shouldInject =
      process.env.NODE_ENV === 'production' ||
      options.forceEnable === true;

    if (!shouldInject) {
      console.log('⏭️  Speed Insights: Skipped (not in production mode)');
      return null;
    }

    const result = injectSpeedInsights({
      framework: 'express',
      debug: process.env.NODE_ENV !== 'production',
      ...options,
    });

    console.log('✅ Speed Insights: Initialized successfully');
    return result;
  } catch (error) {
    console.error('❌ Speed Insights: Initialization failed', error);
    return null;
  }
};

/**
 * Generate Speed Insights script tags for HTML injection
 * Use this for server-rendered HTML pages
 */
export const getSpeedInsightsScript = () => {
  return `
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
  `;
};
