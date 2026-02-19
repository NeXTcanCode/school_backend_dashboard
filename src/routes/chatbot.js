const express = require('express');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const {
  getReply,
  updateFeedback,
  getInsights,
} = require('../controllers/chatbotController');

const router = express.Router();

router.use(auth);
router.use(tenant);

router.post('/reply', getReply);
router.patch('/messages/:id/feedback', updateFeedback);
router.get('/messages/insights', getInsights);

module.exports = router;
