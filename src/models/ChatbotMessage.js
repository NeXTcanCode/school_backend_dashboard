const mongoose = require('mongoose');

const chatbotMessageSchema = new mongoose.Schema(
  {
    schoolCode: { type: String, required: true, index: true, trim: true },
    sessionId: { type: String, required: true, index: true, trim: true },
    userMessage: { type: String, required: true, trim: true, maxlength: 1000 },
    botReply: { type: String, trim: true, maxlength: 2000 },
    intentId: { type: String, trim: true, default: 'generic_fallback' },
    confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
    feedback: { type: String, enum: ['up', 'down', null], default: null },
    route: { type: String, trim: true, maxlength: 120 },
    source: { type: String, enum: ['knowledge', 'history', 'fallback'], default: 'fallback' },
  },
  { timestamps: true }
);

chatbotMessageSchema.index({ schoolCode: 1, createdAt: -1 });
chatbotMessageSchema.index({ schoolCode: 1, intentId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatbotMessage', chatbotMessageSchema);
