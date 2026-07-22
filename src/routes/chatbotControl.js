const express = require('express');
const requireAdminToken = require('../middleware/requireAdminToken');
const {
  isChatbotEnabled,
  setChatbotEnabled,
} = require('../services/handoffService');

const router = express.Router();

router.use(requireAdminToken);

router.get('/status', (_req, res) => {
  res.json({ enabled: isChatbotEnabled() });
});

router.post('/status', (req, res) => {
  if (typeof req.body.enabled !== 'boolean') {
    return res.status(400).json({
      error: 'The enabled field must be true or false.',
    });
  }

  const enabled = setChatbotEnabled(req.body.enabled);
  return res.json({ enabled });
});

module.exports = router;
