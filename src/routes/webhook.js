const express = require('express');
const router = express.Router();
const verifySignature = require('../middleware/verifySignature');
const { verifyWebhook, handleWebhook } = require('../controllers/webhookController');

/**
 * GET /api/webhooks/facebook
 *
 * Facebook webhook verification handshake.
 * Called once when you click "Verify and Save" in the Meta Developer Dashboard.
 *
 * Callback URL to enter in Meta:
 *   https://your-domain.com/api/webhooks/facebook
 */
router.get('/', verifyWebhook);

/**
 * POST /api/webhooks/facebook
 *
 * Receives all real-time events from Facebook Messenger:
 * messages, postbacks, delivery confirmations, read receipts, etc.
 *
 * The verifySignature middleware validates the X-Hub-Signature-256 header
 * to ensure the request came from Facebook (not a forged source).
 */
router.post('/', verifySignature, handleWebhook);

module.exports = router;
