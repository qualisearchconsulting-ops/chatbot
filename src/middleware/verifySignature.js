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
  const appSecret = process.env.APP_SECRET;

  // If APP_SECRET is not configured, skip signature verification
  if (!appSecret) {
    logger.warn('APP_SECRET not set — skipping signature verification (not recommended for production)');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    logger.warn('Webhook request missing X-Hub-Signature-256 header', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Missing signature header' });
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
