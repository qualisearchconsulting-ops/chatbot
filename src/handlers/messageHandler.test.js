jest.mock('../services/messengerService', () => ({
  sendTextMessage: jest.fn().mockResolvedValue({}),
  sendTypingOn: jest.fn().mockResolvedValue({}),
  sendQuickReplies: jest.fn().mockResolvedValue({}),
  sendGenericTemplate: jest.fn().mockResolvedValue({}),
  getUserProfile: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/groqService', () => ({ askGroq: jest.fn() }));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const messenger = require('../services/messengerService');
const { handleTextMessage } = require('./messageHandler');

describe('account intent routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test.each([
    'diko ma access account ko',
    'hindi ma-access ang account ko',
    'ayaw mag login ng account ko',
    'nakalimutan ko password ko',
    `I can't log in to my account`,
  ])('gives recovery help for: %s', async (message) => {
    await handleTextMessage('sender-1', message);

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain('Forgot Password');
    expect(replies).toContain('Huwag ipadala ang password o OTP');
    expect(replies).not.toContain('Having an account lets you');
  });

  test('keeps registration requests on the creation response', async () => {
    await handleTextMessage('sender-1', 'How do I create an account?');

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain('Having an account lets you');
    expect(replies).not.toContain('Forgot Password');
  });
});
