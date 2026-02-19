const mongoose = require('mongoose');

const chatbotFeedbackQueueSchema = new mongoose.Schema(
  {
    schoolCode: { type: String, required: true, index: true, trim: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatbotMessage', required: true, index: true },
    userMessage: { type: String, required: true, trim: true, maxlength: 1000 },
    botReply: { type: String, trim: true, maxlength: 2000 },
    intentId: { type: String, trim: true },
    feedback: { type: String, enum: ['down'], required: true },
    expectedAnswer: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'reviewed', 'resolved'], default: 'open', index: true },
  },
  { timestamps: true }
);

chatbotFeedbackQueueSchema.index({ schoolCode: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ChatbotFeedbackQueue', chatbotFeedbackQueueSchema);
