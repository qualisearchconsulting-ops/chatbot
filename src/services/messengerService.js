const axios = require('axios');
const logger = require('../utils/logger');
const { rememberAutomatedMessage } = require('./handoffService');

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

// Keep every user-facing Messenger reply free of emoji, including AI-generated
// text and quick-reply labels.
const EMOJI_PATTERN = /(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?(?:\u200D\p{Extended_Pictographic}(?:[\uFE0E\uFE0F])?)*)/gu;

const removeEmojis = (value) => value
  .replace(EMOJI_PATTERN, '')
  .replace(/[\uFE0E\uFE0F]/gu, '')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/[ \t]+$/gm, '')
  .trim();

/**
 * Send a text message reply to a user via the Messenger Send API.
 * @param {string} recipientId - The PSID (Page-Scoped ID) of the recipient
 * @param {string} text - The text message to send
 */
const sendTextMessage = async (recipientId, text) => {
  try {
    const sanitizedText = removeEmojis(text);
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: sanitizedText },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    logger.info('Message sent successfully', {
      recipientId,
      messageId: response.data.message_id,
    });
    rememberAutomatedMessage(response.data.message_id);

    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error('Failed to send message', { recipientId, error: errData });
    throw error;
  }
};

/**
 * Send a "Typing On" bubble to indicate the bot is processing.
 * @param {string} recipientId
 */
const sendTypingOn = async (recipientId) => {
  try {
    await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on',
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
      }
    );
  } catch (error) {
    logger.warn('Failed to send typing indicator', {
      recipientId,
      error: error.message,
    });
  }
};

/**
 * Send a quick replies message.
 * @param {string} recipientId
 * @param {string} text
 * @param {Array<{content_type: string, title: string, payload: string}>} quickReplies
 */
const sendQuickReplies = async (recipientId, text, quickReplies) => {
  try {
    const sanitizedText = removeEmojis(text);
    const sanitizedQuickReplies = quickReplies.map((quickReply) => ({
      ...quickReply,
      title: removeEmojis(quickReply.title),
    }));
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          text: sanitizedText,
          quick_replies: sanitizedQuickReplies,
        },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
      }
    );

    logger.info('Quick replies sent', { recipientId });
    rememberAutomatedMessage(response.data.message_id);
    return response.data;
  } catch (error) {
    logger.error('Failed to send quick replies', {
      recipientId,
      error: error.response?.data || error.message,
    });
    throw error;
  }
};

/**
 * Configure the greeting and FAQ ice breakers shown before a new conversation.
 * Messenger supports up to four ice breakers.
 */
const configureMessengerProfile = async () => {
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messenger_profile`,
      {
        greeting: [
          {
            locale: 'default',
            text: 'Hi! Welcome to QualiSearch. How can we assist you today?',
          },
        ],
        ice_breakers: [
          { question: 'How do I submit a manuscript?', payload: 'ARTICLE_SUBMISSION' },
          { question: 'How much is the publication fee?', payload: 'PUBLICATION_FEE' },
          { question: 'How can I apply as a peer reviewer?', payload: 'PEER_REVIEWER_APPLICATION' },
          { question: 'What is the peer-review process?', payload: 'PEER_REVIEW_PROCESS' },
        ],
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    logger.info('Messenger profile configured');
    return response.data;
  } catch (error) {
    logger.warn('Could not configure Messenger profile', {
      error: error.response?.data || error.message,
    });
    return null;
  }
};

/**
 * Send a generic template (carousel of cards).
 * @param {string} recipientId
 * @param {Array} elements - Array of card elements
 */
const sendGenericTemplate = async (recipientId, elements) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements,
            },
          },
        },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
      }
    );

    logger.info('Generic template sent', { recipientId });
    rememberAutomatedMessage(response.data.message_id);
    return response.data;
  } catch (error) {
    logger.error('Failed to send generic template', {
      recipientId,
      error: error.response?.data || error.message,
    });
    throw error;
  }
};

/**
 * Get the user's profile information from the Graph API.
 * @param {string} psid - Page-Scoped User ID
 */
const getUserProfile = async (psid) => {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${psid}`, {
      params: {
        fields: 'first_name,last_name,profile_pic',
        access_token: process.env.PAGE_ACCESS_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    logger.warn('Could not fetch user profile', {
      psid,
      error: error.response?.data || error.message,
    });
    return null;
  }
};

module.exports = {
  sendTextMessage,
  sendTypingOn,
  sendQuickReplies,
  configureMessengerProfile,
  sendGenericTemplate,
  getUserProfile,
};
