const ChatbotMessage = require('../models/ChatbotMessage');
const ChatbotKnowledge = require('../models/ChatbotKnowledge');
const ChatbotFeedbackQueue = require('../models/ChatbotFeedbackQueue');

const MAX_QUESTION_LENGTH = 1000;

const cleanValue = (value = '') =>
  String(value)
    .replace(/^"+|"+$/g, '')
    .replace(/,+$/g, '')
    .trim();

const normalizeText = (text = '') =>
  cleanValue(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(' ').map((token) => {
    if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
    return token;
  });
};

const overlapScore = (questionTokens, candidateText, candidateKeywords = []) => {
  const keywordList = Array.isArray(candidateKeywords)
    ? candidateKeywords
    : String(candidateKeywords || '')
        .split('|')
        .map((k) => k.trim())
        .filter(Boolean);

  const candidateTokens = new Set([
    ...tokenize(candidateText),
    ...keywordList.flatMap((k) => tokenize(k)),
  ]);

  let hits = 0;
  questionTokens.forEach((token) => {
    if (candidateTokens.has(token)) hits += 1;
  });

  return hits;
};

const fallbackReply = {
  text: 'I can help with settings, features, and posting news/events/gallery. Try asking with specific action words like create, update, or enable.',
  intentId: 'generic_fallback',
  confidence: 'low',
  source: 'fallback',
};

const getSmallTalkReply = (questionText = '') => {
  const q = normalizeText(questionText);

  const greetingWords = ['hi', 'hello', 'hey', 'hii', 'heyy'];
  if (greetingWords.some((w) => q === w || q.startsWith(`${w} `))) {
    return {
      text: 'Hi! I can help you with Settings, Features, News, Events, and Gallery actions. What do you want to do?',
      intentId: 'smalltalk_greeting',
      confidence: 'high',
      source: 'fallback',
    };
  }

  if (q.includes('how are you')) {
    return {
      text: "I'm doing great. Tell me your task and I will guide you step by step in this dashboard.",
      intentId: 'smalltalk_how_are_you',
      confidence: 'high',
      source: 'fallback',
    };
  }

  return null;
};

const getOutOfScopeReply = (questionText = '') => {
  const q = normalizeText(questionText);
  const outOfScopeKeywords = [
    'hostel',
    'library',
    'transport',
    'bus',
    'fees',
    'payroll',
    'exam',
    'attendance',
    'admission',
    'result',
  ];

  if (outOfScopeKeywords.some((k) => q.includes(k))) {
    return {
      text: 'This feature will be included in a future version.',
      intentId: 'out_of_scope',
      confidence: 'high',
      source: 'fallback',
    };
  }

  return null;
};

exports.getReply = async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const cleanQuestion = question.trim().slice(0, MAX_QUESTION_LENGTH);
    const questionTokens = tokenize(cleanQuestion);
    const smallTalk = getSmallTalkReply(cleanQuestion);
    const outOfScope = getOutOfScopeReply(cleanQuestion);

    if (smallTalk) {
      const savedSmallTalk = await ChatbotMessage.create({
        schoolCode: req.schoolCode,
        sessionId: sessionId.trim(),
        userMessage: cleanQuestion,
        botReply: smallTalk.text,
        intentId: smallTalk.intentId,
        confidence: smallTalk.confidence,
        source: smallTalk.source,
      });

      return res.status(200).json({
        success: true,
        data: {
          messageId: savedSmallTalk._id,
          reply: smallTalk.text,
          route: null,
          routeLabel: null,
          intentId: smallTalk.intentId,
          confidence: smallTalk.confidence,
          source: smallTalk.source,
        },
      });
    }

    if (outOfScope) {
      const savedOutOfScope = await ChatbotMessage.create({
        schoolCode: req.schoolCode,
        sessionId: sessionId.trim(),
        userMessage: cleanQuestion,
        botReply: outOfScope.text,
        intentId: outOfScope.intentId,
        confidence: outOfScope.confidence,
        source: outOfScope.source,
      });

      return res.status(200).json({
        success: true,
        data: {
          messageId: savedOutOfScope._id,
          reply: outOfScope.text,
          route: null,
          routeLabel: null,
          intentId: outOfScope.intentId,
          confidence: outOfScope.confidence,
          source: outOfScope.source,
        },
      });
    }

    const schoolCode = cleanValue(req.schoolCode);
    const knowledgeDocs = await ChatbotKnowledge.find({
      approved: true,
      schoolCode: { $in: [schoolCode, `${schoolCode},`, 'GLOBAL', 'GLOBAL,'] },
    })
      .sort({ schoolCode: -1, updatedAt: -1 })
      .limit(500);

    let bestKnowledge = null;

    for (const doc of knowledgeDocs) {
      const score = overlapScore(questionTokens, doc.questionPattern, doc.keywords || []);
      if (!bestKnowledge || score > bestKnowledge.score) {
        bestKnowledge = { doc, score };
      }
    }

    let reply = { ...fallbackReply };

    const minKnowledgeScore = questionTokens.length <= 2 ? 1 : 2;

    if (bestKnowledge && bestKnowledge.score >= minKnowledgeScore) {
      reply = {
        text: cleanValue(bestKnowledge.doc.answerText),
        route: cleanValue(bestKnowledge.doc.route) || undefined,
        intentId: cleanValue(bestKnowledge.doc.intentId) || 'knowledge_match',
        confidence: bestKnowledge.score >= 3 ? 'high' : 'medium',
        source: 'knowledge',
      };

      await ChatbotKnowledge.updateOne({ _id: bestKnowledge.doc._id }, { $inc: { usageCount: 1 } });
    } else {
      const history = await ChatbotMessage.find({
        schoolCode: req.schoolCode,
        feedback: 'up',
      })
        .sort({ createdAt: -1 })
        .limit(150);

      let bestHistory = null;
      for (const item of history) {
        const score = overlapScore(questionTokens, item.userMessage, []);
        if (!bestHistory || score > bestHistory.score) {
          bestHistory = { item, score };
        }
      }

      if (bestHistory && bestHistory.score >= 2) {
        reply = {
          text: bestHistory.item.botReply,
          route: bestHistory.item.route,
          intentId: bestHistory.item.intentId || 'history_match',
          confidence: 'medium',
          source: 'history',
        };
      }
    }

    const saved = await ChatbotMessage.create({
      schoolCode: req.schoolCode,
      sessionId: sessionId.trim(),
      userMessage: cleanQuestion,
      botReply: reply.text,
      intentId: reply.intentId,
      confidence: reply.confidence,
      route: reply.route,
      source: reply.source,
    });

    return res.status(200).json({
      success: true,
      data: {
        messageId: saved._id,
        reply: reply.text,
        route: reply.route,
        routeLabel: reply.route ? `Open ${reply.route.replace('/', '').replace('-', ' ')}` : null,
        intentId: reply.intentId,
        confidence: reply.confidence,
        source: reply.source,
      },
    });
  } catch (error) {
    console.error(`Chatbot Reply Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to generate chatbot reply' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { feedback, expectedAnswer } = req.body;
    const { id } = req.params;

    if (!['up', 'down'].includes(feedback)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback' });
    }

    const message = await ChatbotMessage.findOneAndUpdate(
      { _id: id, schoolCode: req.schoolCode },
      { $set: { feedback } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (feedback === 'down') {
      await ChatbotFeedbackQueue.create({
        schoolCode: req.schoolCode,
        messageId: message._id,
        userMessage: message.userMessage,
        botReply: message.botReply,
        intentId: message.intentId,
        feedback: 'down',
        expectedAnswer: typeof expectedAnswer === 'string' ? expectedAnswer.trim().slice(0, 2000) : undefined,
      });
    }

    return res.status(200).json({ success: true, data: message });
  } catch (error) {
    console.error(`Chatbot Feedback Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to update feedback' });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const [totals, intentBreakdown, lowConfidence, feedbackBreakdown] = await Promise.all([
      ChatbotMessage.countDocuments({ schoolCode: req.schoolCode }),
      ChatbotMessage.aggregate([
        { $match: { schoolCode: req.schoolCode } },
        { $group: { _id: '$intentId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ChatbotMessage.countDocuments({ schoolCode: req.schoolCode, confidence: 'low' }),
      ChatbotMessage.aggregate([
        { $match: { schoolCode: req.schoolCode, feedback: { $in: ['up', 'down'] } } },
        { $group: { _id: '$feedback', count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalMessages: totals,
        lowConfidenceCount: lowConfidence,
        intentBreakdown,
        feedbackBreakdown,
        fallbackRate: totals ? Number(((lowConfidence / totals) * 100).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    console.error(`Chatbot Insights Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to fetch chatbot insights' });
  }
};
