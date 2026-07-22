require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const logger = require('./utils/logger');
const webhookRoutes = require('./routes/webhook');
const chatbotControlRoutes = require('./routes/chatbotControl');

const app = express();

// ─────────────────────────────────────────────────────────
// CRITICAL: Capture raw body BEFORE JSON parsing
// Required for HMAC-SHA256 signature verification.
// The signature is computed against the raw bytes of the body.
// ─────────────────────────────────────────────────────────
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// HTTP request logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// ─────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'QualiSearch Facebook Webhook',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Facebook Messenger Webhook
// Callback URL: https://your-domain.com/api/webhooks/facebook
app.use('/api/webhooks/facebook', webhookRoutes);

// Password-protected chatbot on/off control API and its static control page.
app.use('/api/chatbot', chatbotControlRoutes);
app.get('/chatbot-control', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot-control.html'));
});

// ─────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ─────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('Unhandled application error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

module.exports = app;
