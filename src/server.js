require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { startKeepAlive } = require('./utils/keepAlive');
const { configureMessengerProfile } = require('./services/messengerService');

const PORT = process.env.PORT || 3000;

// Validate required environment variables before starting
const requiredEnvVars = ['PAGE_ACCESS_TOKEN', 'VERIFY_TOKEN'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  logger.error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
  );
  process.exit(1);
}

// Optional: APP_SECRET enables HMAC-SHA256 signature verification
if (!process.env.APP_SECRET) {
  logger.warn('⚠️  APP_SECRET not set — webhook signature verification is DISABLED');
}

const server = app.listen(PORT, () => {
  logger.info('🚀 QualiSearch Facebook Webhook Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    webhookPath: '/api/webhooks/facebook',
    healthCheck: `/health`,
  });

  // Start keep-alive pinger for Render free tier
  startKeepAlive();

  // Keep the Page greeting and pre-chat FAQ choices in sync with the bot.
  configureMessengerProfile();

  if (process.env.NODE_ENV !== 'production') {
    logger.info(
      `\n  ┌─────────────────────────────────────────────────┐\n` +
        `  │  Facebook Messenger Webhook is running!          │\n` +
        `  │                                                   │\n` +
        `  │  Callback URL (for Meta Dashboard):               │\n` +
        `  │  http://localhost:${PORT}/api/webhooks/facebook    │\n` +
        `  │                                                   │\n` +
        `  │  Health Check:                                    │\n` +
        `  │  http://localhost:${PORT}/health                   │\n` +
        `  └─────────────────────────────────────────────────┘`
    );
  }
});

// Graceful shutdown on SIGTERM (for Render, Heroku, etc.)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
});

module.exports = server;
