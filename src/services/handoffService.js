const logger = require('../utils/logger');

const DEFAULT_HANDOFF_MINUTES = 30;
const AUTOMATED_MESSAGE_TTL_MS = 5 * 60 * 1000;

const pausedConversations = new Map();
const automatedMessages = new Map();
let enabledOverride = null;

const getHandoffDurationMs = () => {
  const configuredMinutes = Number(process.env.HUMAN_HANDOFF_MINUTES);
  const minutes = Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_HANDOFF_MINUTES;

  return minutes * 60 * 1000;
};

const isChatbotEnabled = () => enabledOverride ??
  String(process.env.CHATBOT_ENABLED || 'true').toLowerCase() !== 'false';

const setChatbotEnabled = (enabled) => {
  enabledOverride = Boolean(enabled);
  logger.info('Chatbot status changed from control page', { enabled: enabledOverride });
  return enabledOverride;
};

const pauseConversation = (recipientId, now = Date.now()) => {
  if (!recipientId) return;

  const pausedUntil = now + getHandoffDurationMs();
  pausedConversations.set(recipientId, pausedUntil);
  logger.info('Chatbot paused for human handoff', { recipientId, pausedUntil });
};

const isConversationPaused = (recipientId, now = Date.now()) => {
  const pausedUntil = pausedConversations.get(recipientId);

  if (!pausedUntil) return false;
  if (pausedUntil <= now) {
    pausedConversations.delete(recipientId);
    logger.info('Chatbot resumed after human handoff', { recipientId });
    return false;
  }

  return true;
};

const rememberAutomatedMessage = (messageId, now = Date.now()) => {
  if (messageId) automatedMessages.set(messageId, now + AUTOMATED_MESSAGE_TTL_MS);
};

const consumeAutomatedMessage = (messageId, now = Date.now()) => {
  if (!messageId) return false;

  const expiresAt = automatedMessages.get(messageId);
  automatedMessages.delete(messageId);
  return Boolean(expiresAt && expiresAt > now);
};

const resetForTests = () => {
  pausedConversations.clear();
  automatedMessages.clear();
  enabledOverride = null;
};

module.exports = {
  isChatbotEnabled,
  setChatbotEnabled,
  pauseConversation,
  isConversationPaused,
  rememberAutomatedMessage,
  consumeAutomatedMessage,
  resetForTests,
};
