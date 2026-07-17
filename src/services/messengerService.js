const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

/**
 * Send a text message reply to a user via the Messenger Send API.
 * @param {string} recipientId - The PSID (Page-Scoped ID) of the recipient
 * @param {string} text - The text message to send
 */
const sendTextMessage = async (recipientId, text) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text },
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
    const response = await axios.post(
      `${GRAPH_API_BASE}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          text,
          quick_replies: quickReplies,
        },
        messaging_type: 'RESPONSE',
      },
      {
        params: { access_token: process.env.PAGE_ACCESS_TOKEN },
      }
    );

    logger.info('Quick replies sent', { recipientId });
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
  sendGenericTemplate,
  getUserProfile,
};
