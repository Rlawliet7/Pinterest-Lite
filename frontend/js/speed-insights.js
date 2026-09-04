/**
 * Vercel Speed Insights Integration
 * This script initializes Speed Insights to track web vitals and performance metrics
 */

import { injectSpeedInsights } from './speed-insights-lib.mjs';

// Initialize Speed Insights
// In production, this will track performance metrics
// In development, it will show debug logs but won't send data
injectSpeedInsights({
  // Optional: Enable debug mode in development
  debug: true,
});

console.log('[LOG] Speed Insights initialized');
