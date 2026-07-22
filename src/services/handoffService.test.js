jest.mock('../utils/logger', () => ({ info: jest.fn() }));

const handoff = require('./handoffService');

describe('human handoff state', () => {
  beforeEach(() => {
    handoff.resetForTests();
    delete process.env.CHATBOT_ENABLED;
    delete process.env.HUMAN_HANDOFF_MINUTES;
  });

  test('pauses only the selected conversation and resumes after the timeout', () => {
    const now = 1_000;
    handoff.pauseConversation('customer-1', now);

    expect(handoff.isConversationPaused('customer-1', now + 29 * 60 * 1000)).toBe(true);
    expect(handoff.isConversationPaused('customer-2', now)).toBe(false);
    expect(handoff.isConversationPaused('customer-1', now + 30 * 60 * 1000)).toBe(false);
  });

  test('recognizes an echo created by the chatbot', () => {
    handoff.rememberAutomatedMessage('mid.123', 1_000);

    expect(handoff.consumeAutomatedMessage('mid.123', 2_000)).toBe(true);
    expect(handoff.consumeAutomatedMessage('mid.123', 2_000)).toBe(false);
  });

  test('supports a global environment switch', () => {
    expect(handoff.isChatbotEnabled()).toBe(true);
    process.env.CHATBOT_ENABLED = 'false';
    expect(handoff.isChatbotEnabled()).toBe(false);
  });
});
