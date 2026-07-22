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
    expect(replies).toContain('Never send your password or OTP');
    expect(replies).not.toContain('Having an account lets you');
  });

  test('keeps registration requests on the creation response', async () => {
    await handleTextMessage('sender-1', 'How do I create an account?');

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain('Having an account lets you');
    expect(replies).not.toContain('Forgot Password');
  });
});

describe('welcome FAQ routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test('shows the requested welcome text and six menu options', async () => {
    await handleTextMessage('sender-1', 'Hi');

    const [senderId, prompt, options] = messenger.sendQuickReplies.mock.calls[0];
    expect(senderId).toBe('sender-1');
    expect(prompt).toBe('Hi! Welcome to QualiSearch. How can we assist you today?');
    expect(options).toHaveLength(6);
  });

  test.each([
    ['How can I apply as a peer reviewer?', 'updated CV'],
    ['What is the peer-review process?', 'double-blind peer-review process'],
    ['How long does publication take?', 'Publication time varies'],
  ])('routes %s to the matching answer', async (question, expectedReply) => {
    await handleTextMessage('sender-1', question);

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain(expectedReply);
  });
});

describe('response formatting and submission link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test('uses bullets and the official publishing page for submission steps', async () => {
    await handleTextMessage('sender-1', 'How do I submit my manuscript?');

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain('• Open the official submission page');
    expect(replies).toContain('https://qualisearchglobal.com/academic-press/publish.html');
    expect(replies).not.toContain('Head over to https://qualisearchglobal.com/\n');
  });

  test('uses bullets for step-by-step account recovery instructions', async () => {
    await handleTextMessage('sender-1', `I can't log in to my account`);

    const replies = messenger.sendTextMessage.mock.calls.map((call) => call[1]).join('\n');
    expect(replies).toContain('• Go to');
    expect(replies).toContain('• Select Forgot Password');
  });
});
