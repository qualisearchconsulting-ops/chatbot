const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware to verify that incoming webhook requests genuinely
 * come from Facebook by validating the X-Hub-Signature-256 header.
 *
 * Facebook signs every POST payload with your App Secret using HMAC-SHA256.
 * We compute our own signature and compare — any mismatch means the
 * request is forged and should be rejected.
 */
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    logger.warn('Webhook request missing X-Hub-Signature-256 header', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Missing signature header' });
  }

  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    logger.error('APP_SECRET is not configured in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Compute our expected signature
  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', appSecret)
      .update(req.rawBody) // rawBody is captured in app.js
      .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    logger.warn('Webhook signature verification failed', {
      received: signature,
      ip: req.ip,
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  logger.debug('Webhook signature verified successfully');
  next();
};

module.exports = verifySignature;
