const request = require('supertest');
const app = require('../app');
const handoff = require('../services/handoffService');

describe('chatbot control API', () => {
  beforeEach(() => {
    process.env.CHATBOT_ADMIN_TOKEN = 'test-admin-token';
    delete process.env.CHATBOT_ENABLED;
    handoff.resetForTests();
  });

  afterAll(() => {
    delete process.env.CHATBOT_ADMIN_TOKEN;
  });

  test('rejects requests without the admin token', async () => {
    await request(app).get('/api/chatbot/status').expect(401);
  });

  test('turns the chatbot off and reports its status', async () => {
    const authorization = { Authorization: 'Bearer test-admin-token' };

    await request(app)
      .post('/api/chatbot/status')
      .set(authorization)
      .send({ enabled: false })
      .expect(200, { enabled: false });

    await request(app)
      .get('/api/chatbot/status')
      .set(authorization)
      .expect(200, { enabled: false });
  });

  test('serves the static control page', async () => {
    const response = await request(app).get('/chatbot-control').expect(200);
    expect(response.text).toContain('QualiSearch Chatbot');
    expect(response.text).toContain('Turn chatbot OFF');
  });
});
