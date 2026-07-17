const logger = require('../utils/logger');
const handler = require('../handlers/messageHandler');

/**
 * GET /api/webhooks/facebook
 *
 * Facebook webhook verification endpoint.
 * When you click "Verify and Save" in the Meta Developer Dashboard,
 * Facebook sends a GET request with these query params:
 *   - hub.mode       = "subscribe"
 *   - hub.verify_token = (the token you entered in the dashboard)
 *   - hub.challenge   = a random number that must be echoed back
 *
 * If your VERIFY_TOKEN matches, respond with hub.challenge to confirm ownership.
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification request received', { mode, token: token ? '***' : 'missing' });

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    logger.info('✅ Webhook verified successfully by Facebook');
    return res.status(200).send(challenge);
  }

  logger.warn('❌ Webhook verification failed — token mismatch', {
    expectedToken: process.env.VERIFY_TOKEN ? '***' : 'NOT SET',
    receivedMode: mode,
  });

  return res.status(403).json({
    error: 'Forbidden',
    message: 'Verification token mismatch',
  });
};

/**
 * POST /api/webhooks/facebook
 *
 * Main webhook handler that receives all events from Facebook Messenger.
 * Events are batched — one POST can contain multiple entries and messaging objects.
 *
 * Always respond with 200 OK immediately; process events asynchronously.
 * If you take too long to respond, Facebook will retry the delivery.
 */
const handleWebhook = (req, res) => {
  const body = req.body;

  // Confirm this is a Page subscription event
  if (body.object !== 'page') {
    logger.warn('Received non-page webhook event', { object: body.object });
    return res.status(404).json({ error: 'Not a page subscription' });
  }

  // ✅ Acknowledge receipt immediately (Facebook requires < 5s response)
  res.status(200).send('EVENT_RECEIVED');

  // Process each entry asynchronously (don't block the response)
  if (!body.entry || !Array.isArray(body.entry)) {
    logger.warn('Webhook body has no entry array');
    return;
  }

  body.entry.forEach((entry) => {
    // Each entry can have multiple messaging events
    const messagingEvents = entry.messaging;

    if (!messagingEvents || !Array.isArray(messagingEvents)) {
      return;
    }

    messagingEvents.forEach((event) => {
      processEvent(event).catch((err) => {
        logger.error('Error processing webhook event', {
          error: err.message,
          event,
        });
      });
    });
  });
};

/**
 * Route a single messaging event to the correct handler.
 * @param {Object} event - A single messaging event from Facebook
 */
const processEvent = async (event) => {
  const senderId = event.sender?.id;

  if (!senderId) {
    logger.warn('Event missing sender ID', { event });
    return;
  }

  logger.debug('Processing event', { senderId, eventType: getEventType(event) });

  // ── Text message ──────────────────────────────────
  if (event.message && event.message.text && !event.message.quick_reply) {
    await handler.handleTextMessage(senderId, event.message.text);
    return;
  }

  // ── Quick reply (button tap) ──────────────────────
  if (event.message?.quick_reply) {
    await handler.handleQuickReply(
      senderId,
      event.message.quick_reply.payload,
      event.message.text
    );
    return;
  }

  // ── Attachment (image, audio, video, file, etc.) ──
  if (event.message?.attachments) {
    await handler.handleAttachment(senderId, event.message.attachments);
    return;
  }

  // ── Postback (persistent menu button, Get Started) ─
  if (event.postback) {
    await handler.handlePostback(senderId, event.postback.payload, event.postback.title);
    return;
  }

  // ── Read receipt ──────────────────────────────────
  if (event.read) {
    handler.handleRead(senderId, event.read.watermark);
    return;
  }

  // ── Delivery confirmation ─────────────────────────
  if (event.delivery) {
    handler.handleDelivery(senderId, event.delivery.watermark);
    return;
  }

  logger.debug('Unhandled event type', { senderId, event });
};

/**
 * Helper: Identify the event type for logging purposes.
 */
const getEventType = (event) => {
  if (event.message?.quick_reply) return 'quick_reply';
  if (event.message?.attachments) return 'attachment';
  if (event.message?.text) return 'text_message';
  if (event.postback) return 'postback';
  if (event.read) return 'read_receipt';
  if (event.delivery) return 'delivery';
  return 'unknown';
};

module.exports = { verifyWebhook, handleWebhook };
