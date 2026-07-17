const messenger = require('../services/messengerService');
const logger = require('../utils/logger');

/**
 * Handle a received text message from a user.
 * This is the main AI/bot logic entry point.
 * Customize the responses here to fit QualiSearch's use case.
 */
const handleTextMessage = async (senderId, messageText) => {
  const text = messageText.toLowerCase().trim();

  logger.info('Handling text message', { senderId, text });

  // Show typing indicator while processing
  await messenger.sendTypingOn(senderId);

  // ─────────────────────────────────────────────────
  // Intent matching — customize these for QualiSearch
  // ─────────────────────────────────────────────────

  if (['hi', 'hello', 'hey', 'start', 'get started'].some((w) => text.includes(w))) {
    await messenger.sendTextMessage(
      senderId,
      '👋 Hi there! Welcome to QualiSearch. I\'m your AI assistant.\n\nHow can I help you today?'
    );
    await messenger.sendQuickReplies(senderId, 'Choose an option to get started:', [
      { content_type: 'text', title: '🔍 Search Jobs', payload: 'SEARCH_JOBS' },
      { content_type: 'text', title: '📋 My Applications', payload: 'MY_APPLICATIONS' },
      { content_type: 'text', title: '💬 Talk to Support', payload: 'SUPPORT' },
    ]);
    return;
  }

  if (text.includes('job') || text.includes('search') || text.includes('find')) {
    await messenger.sendTextMessage(
      senderId,
      '🔍 I can help you find the perfect job!\n\nPlease tell me:\n• What role are you looking for?\n• What city or location?\n• Full-time or part-time?'
    );
    return;
  }

  if (text.includes('apply') || text.includes('application')) {
    await messenger.sendTextMessage(
      senderId,
      '📋 To check your applications or apply for a new position, please visit:\n👉 https://www.qualisearch.com/applications\n\nOr tell me what role you\'d like to apply for!'
    );
    return;
  }

  if (text.includes('help') || text.includes('support')) {
    await messenger.sendTextMessage(
      senderId,
      '🆘 Need help? Our support team is here for you!\n\n📧 Email: support@qualisearch.com\n📞 Phone: +1 (800) 123-4567\n🕐 Available: Mon–Fri, 9am–6pm'
    );
    return;
  }

  if (text.includes('contact') || text.includes('human') || text.includes('agent')) {
    await messenger.sendTextMessage(
      senderId,
      '👤 Connecting you to a human agent...\n\nA QualiSearch team member will respond within a few minutes. Thank you for your patience!'
    );
    return;
  }

  // Default fallback response
  await messenger.sendTextMessage(
    senderId,
    `I received your message: "${messageText}"\n\nI'm still learning, but I'll do my best to help! 😊\n\nFor immediate assistance, type "help" or "support".`
  );
};

/**
 * Handle a postback event (button clicks, quick reply payloads, etc.)
 */
const handlePostback = async (senderId, payload, title) => {
  logger.info('Handling postback', { senderId, payload, title });

  await messenger.sendTypingOn(senderId);

  switch (payload) {
    case 'GET_STARTED':
    case 'SEARCH_JOBS':
      await messenger.sendTextMessage(
        senderId,
        '🔍 Let\'s find you the perfect job!\n\nWhat type of position are you looking for? (e.g., Software Engineer, Marketing Manager, Sales Representative)'
      );
      break;

    case 'MY_APPLICATIONS':
      await messenger.sendTextMessage(
        senderId,
        '📋 To view your applications, please log in to your QualiSearch account:\n👉 https://www.qualisearch.com/login\n\nDon\'t have an account? Sign up free at https://www.qualisearch.com/register'
      );
      break;

    case 'SUPPORT':
      await messenger.sendTextMessage(
        senderId,
        '💬 Our support team is ready to help!\n\n📧 support@qualisearch.com\n📞 +1 (800) 123-4567\n\nOr describe your issue here and we\'ll get back to you shortly.'
      );
      break;

    default:
      await messenger.sendTextMessage(
        senderId,
        `You selected: "${title}". How can I assist you further?`
      );
  }
};

/**
 * Handle a quick reply selection
 */
const handleQuickReply = async (senderId, payload, text) => {
  logger.info('Handling quick reply', { senderId, payload, text });
  // Quick replies re-use postback handling
  await handlePostback(senderId, payload, text);
};

/**
 * Handle an attachment (image, audio, video, file, etc.)
 */
const handleAttachment = async (senderId, attachments) => {
  logger.info('Handling attachment', { senderId, count: attachments.length });

  await messenger.sendTextMessage(
    senderId,
    '📎 Thanks for sending that! Unfortunately I can\'t process attachments just yet, but I\'ve noted it.\n\nFor file submissions, please use: https://www.qualisearch.com/upload'
  );
};

/**
 * Handle a "read" receipt event
 */
const handleRead = (senderId, watermark) => {
  logger.debug('Message read receipt', { senderId, watermark });
};

/**
 * Handle a "delivery" confirmation event
 */
const handleDelivery = (senderId, watermark) => {
  logger.debug('Message delivery confirmed', { senderId, watermark });
};

module.exports = {
  handleTextMessage,
  handlePostback,
  handleQuickReply,
  handleAttachment,
  handleRead,
  handleDelivery,
};
