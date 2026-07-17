/**
 * Keep-Alive Pinger for Render.com Free Tier
 *
 * Render's free plan spins down after 15 minutes of inactivity.
 * This module pings the /health endpoint every 10 minutes to prevent sleep.
 *
 * Only runs in production to avoid unnecessary pings locally.
 */

const https = require('https');
const logger = require('./logger');

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const serviceUrl = process.env.RENDER_EXTERNAL_URL;
  if (!serviceUrl) {
    logger.warn('RENDER_EXTERNAL_URL not set — keep-alive pinger disabled');
    return;
  }

  const pingUrl = `${serviceUrl}/health`;

  setInterval(() => {
    https
      .get(pingUrl, (res) => {
        logger.debug('Keep-alive ping sent', {
          url: pingUrl,
          status: res.statusCode,
        });
      })
      .on('error', (err) => {
        logger.warn('Keep-alive ping failed', { error: err.message });
      });
  }, PING_INTERVAL_MS);

  logger.info('🏓 Keep-alive pinger started', {
    url: pingUrl,
    intervalMinutes: 10,
  });
};

module.exports = { startKeepAlive };
