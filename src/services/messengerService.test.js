jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { message_id: 'message-1' } }),
  get: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const axios = require('axios');
const messenger = require('./messengerService');

describe('emoji-free Messenger replies', () => {
  beforeEach(() => jest.clearAllMocks());

  test('removes emojis from text messages', async () => {
    await messenger.sendTextMessage('sender-1', 'Hello! 👋 Payment is ready ✅');

    expect(axios.post.mock.calls[0][1].message.text).toBe('Hello! Payment is ready');
  });

  test('removes emojis from quick-reply prompts and titles', async () => {
    await messenger.sendQuickReplies(
      'sender-1',
      'Choose one 👇',
      [{ content_type: 'text', title: '📝 Article Submission', payload: 'ARTICLE_SUBMISSION' }]
    );

    const message = axios.post.mock.calls[0][1].message;
    expect(message.text).toBe('Choose one');
    expect(message.quick_replies[0].title).toBe('Article Submission');
  });

  test('removes keycap and joined emojis', async () => {
    await messenger.sendTextMessage('sender-1', '1️⃣ Submit\nFamily 👨‍👩‍👧‍👦 support');

    expect(axios.post.mock.calls[0][1].message.text).toBe('Submit\nFamily support');
  });

  test('configures the requested greeting and four pre-chat questions', async () => {
    await messenger.configureMessengerProfile();

    const profile = axios.post.mock.calls[0][1];
    expect(profile.greeting[0].text).toBe(
      'Hi! Welcome to QualiSearch. How can we assist you today?'
    );
    expect(profile.ice_breakers).toHaveLength(4);
    expect(profile.ice_breakers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ payload: 'ARTICLE_SUBMISSION' }),
        expect.objectContaining({ payload: 'PUBLICATION_FEE' }),
        expect.objectContaining({ payload: 'PEER_REVIEWER_APPLICATION' }),
        expect.objectContaining({ payload: 'PEER_REVIEW_PROCESS' }),
      ])
    );
  });
});
