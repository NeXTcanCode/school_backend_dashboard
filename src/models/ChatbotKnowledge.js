const mongoose = require('mongoose');

const chatbotKnowledgeSchema = new mongoose.Schema(
  {
    schoolCode: { type: String, default: 'GLOBAL', index: true, trim: true },
    questionPattern: { type: String, required: true, trim: true, maxlength: 400 },
    keywords: [{ type: String, trim: true }],
    answerText: { type: String, required: true, trim: true, maxlength: 2000 },
    intentId: { type: String, trim: true, default: 'generic' },
    route: { type: String, trim: true, maxlength: 120 },
    tone: { type: String, trim: true, default: 'friendly' },
    followUpQuestion: { type: String, trim: true, maxlength: 300 },
    approved: { type: Boolean, default: true, index: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatbotKnowledgeSchema.index({ schoolCode: 1, approved: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatbotKnowledge', chatbotKnowledgeSchema);
