jest.mock('../handlers/messageHandler', () => ({
  handleTextMessage: jest.fn().mockResolvedValue(),
  handleQuickReply: jest.fn().mockResolvedValue(),
  handleAttachment: jest.fn().mockResolvedValue(),
  handlePostback: jest.fn().mockResolvedValue(),
  handleRead: jest.fn(),
  handleDelivery: jest.fn(),
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const handler = require('../handlers/messageHandler');
const handoff = require('../services/handoffService');
const { processEvent } = require('./webhookController');

describe('webhook human handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    handoff.resetForTests();
    delete process.env.CHATBOT_ENABLED;
  });

  test('a manual Page reply pauses bot replies for its recipient', async () => {
    await processEvent({
      sender: { id: 'customer-1' },
      recipient: { id: 'page-1' },
      message: {
        is_echo: true,
        mid: 'manual-mid',
        app_id: 'meta-business-suite-app',
        text: 'Human reply',
      },
    }, 'page-1');
    await processEvent({
      sender: { id: 'customer-1' },
      recipient: { id: 'page-1' },
      message: { mid: 'incoming-mid', text: 'Thank you' },
    });

    expect(handler.handleTextMessage).not.toHaveBeenCalled();
  });

  test('an echo from the chatbot does not activate handoff', async () => {
    handoff.rememberAutomatedMessage('bot-mid');
    await processEvent({
      sender: { id: 'page-1' },
      recipient: { id: 'customer-1' },
      message: { is_echo: true, mid: 'bot-mid', text: 'Bot reply' },
    }, 'page-1');
    await processEvent({
      sender: { id: 'customer-1' },
      recipient: { id: 'page-1' },
      message: { mid: 'incoming-mid', text: 'Hello' },
    });

    expect(handler.handleTextMessage).toHaveBeenCalledWith('customer-1', 'Hello');
  });

  test('bot metadata identifies an automated echo before its message ID is remembered', async () => {
    await processEvent({
      sender: { id: 'page-1' },
      recipient: { id: 'customer-1' },
      message: {
        is_echo: true,
        mid: 'early-bot-mid',
        metadata: 'QUALISEARCH_CHATBOT',
        text: 'Bot reply',
      },
    }, 'page-1');
    await processEvent({
      sender: { id: 'customer-1' },
      recipient: { id: 'page-1' },
      message: { mid: 'incoming-mid', text: 'Hello' },
    });

    expect(handler.handleTextMessage).toHaveBeenCalledWith('customer-1', 'Hello');
  });

  test('a Page-as-sender manual echo also pauses the customer', async () => {
    await processEvent({
      sender: { id: 'page-1' },
      recipient: { id: 'customer-1' },
      message: { is_echo: true, mid: 'manual-mid-2', text: 'Taking over' },
    }, 'page-1');
    await processEvent({
      sender: { id: 'customer-1' },
      recipient: { id: 'page-1' },
      message: { mid: 'incoming-mid-2', text: 'Are you there?' },
    });

    expect(handler.handleTextMessage).not.toHaveBeenCalled();
  });
});
