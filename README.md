# 🤖 QualiSearch Facebook Messenger Webhook

A production-ready **Facebook Messenger Webhook** built with **Node.js + Express**, designed for QualiSearch's chatbot integration.

---

## 📁 Project Structure

```
chatbotforqualisearch/
├── src/
│   ├── server.js                 ← Entry point
│   ├── app.js                    ← Express app & middleware
│   ├── routes/
│   │   └── webhook.js            ← GET + POST /api/webhooks/facebook
│   ├── controllers/
│   │   └── webhookController.js  ← Verification & event routing
│   ├── handlers/
│   │   └── messageHandler.js     ← Bot logic & intent matching
│   ├── services/
│   │   └── messengerService.js   ← Facebook Graph API calls
│   ├── middleware/
│   │   └── verifySignature.js    ← HMAC-SHA256 security
│   └── utils/
│       └── logger.js             ← Winston logger
├── .env                          ← Your secrets (never commit this!)
├── .env.example                  ← Template for .env
└── package.json
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

| Variable | Where to Find It |
|---|---|
| `PAGE_ACCESS_TOKEN` | Meta Developers → Your App → Messenger → API Settings → Generate Token |
| `VERIFY_TOKEN` | **You choose this** — enter the same string in Meta Dashboard |
| `APP_SECRET` | Meta Developers → Your App → Settings → Basic → App Secret |

### 3. Run Locally
```bash
npm run dev        # Development (with auto-reload)
npm start          # Production
```

### 4. Expose Locally (for testing)
Use **ngrok** to expose localhost to the internet:
```bash
npx ngrok http 3000
```
Copy the `https://` URL — you'll use it in Meta.

---

## ⚙️ Setting Up in Meta Developer Dashboard

### Step 1 — Webhook Configuration

In your Meta Developer Dashboard → **Messenger API Settings** → **Configure Webhooks**:

| Field | Value |
|---|---|
| **Callback URL** | `https://your-domain.com/api/webhooks/facebook` |
| **Verify Token** | (same value as `VERIFY_TOKEN` in your `.env`) |

### Step 2 — Webhook Fields to Subscribe
Subscribe to these fields for full chatbot functionality:

- ✅ `messages` — Receive text messages
- ✅ `messaging_postbacks` — Button clicks & Get Started
- ✅ `message_deliveries` — Delivery confirmations
- ✅ `message_reads` — Read receipts
- ✅ `messaging_referrals` — Referral tracking

### Step 3 — Click "Verify and Save"
If your server is running, Facebook will call your endpoint and verify.

---

## 🔒 Security

- **HMAC-SHA256 Signature Verification** — Every POST request from Facebook includes an `X-Hub-Signature-256` header. The middleware validates this against your `APP_SECRET` to ensure requests are genuine.
- **Timing-safe comparison** — Uses `crypto.timingSafeEqual()` to prevent timing attacks.
- **Environment secrets** — All sensitive values are in `.env`, which is gitignored.

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/webhooks/facebook` | Facebook webhook verification |
| `POST` | `/api/webhooks/facebook` | Receive Messenger events |

---

## 🌐 Deploying to Render.com

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Use the Render URL as your **Callback URL** in Meta:
   ```
   https://your-service-name.onrender.com/api/webhooks/facebook
   ```

---

## 🛠 Customizing Bot Responses

Edit [`src/handlers/messageHandler.js`](src/handlers/messageHandler.js) to add your own intents:

```javascript
if (text.includes('your keyword')) {
  await messenger.sendTextMessage(senderId, 'Your custom response!');
  return;
}
```

---

## 📝 Logs

Log files are saved to the `logs/` directory:

- `logs/combined.log` — All events
- `logs/error.log` — Errors only

## Human handoff (automatic on/off)

### Web control page

Set a long random `CHATBOT_ADMIN_TOKEN` in Render, deploy, then open:

```text
https://your-service-name.onrender.com/chatbot-control
```

Enter the same admin token and use the large ON/OFF button. The change takes
effect immediately, without restarting the service. The token is kept only in
the current browser tab. Because the runtime switch is stored in memory, a new
deployment or service restart returns to the `CHATBOT_ENABLED` default.

When you reply to a customer from Meta Business Suite/Page Inbox, the webhook
automatically pauses chatbot replies for that customer. Each additional manual
reply resets the timer. After `HUMAN_HANDOFF_MINUTES` (30 minutes by default),
the chatbot resumes for that conversation. Other customers can keep using it.

To disable the chatbot for everyone, set `CHATBOT_ENABLED=false` in Render and
restart the service. Set it back to `true` and restart to enable it again.

Environment variables:

- `CHATBOT_ENABLED`: global startup switch; defaults to `true`.
- `HUMAN_HANDOFF_MINUTES`: per-conversation pause time; defaults to `30`.
