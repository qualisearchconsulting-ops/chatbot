const crypto = require('crypto');

const safeEqual = (provided, expected) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const requireAdminToken = (req, res, next) => {
  const expectedToken = process.env.CHATBOT_ADMIN_TOKEN;

  if (!expectedToken) {
    return res.status(503).json({
      error: 'Control page is not configured',
      message: 'Set CHATBOT_ADMIN_TOKEN on the server.',
    });
  }

  const authorization = req.get('authorization') || '';
  const providedToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!providedToken || !safeEqual(providedToken, expectedToken)) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }

  next();
};

module.exports = requireAdminToken;
