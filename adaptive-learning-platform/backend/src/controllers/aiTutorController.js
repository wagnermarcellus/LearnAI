const DiagnosticTest     = require('../models/DiagnosticTest');
const AiInteraction      = require('../models/AiInteraction');
const LearningPath       = require('../models/LearningPath');
const { success }        = require('../utils/response');
const aiService          = require('../services/aiService');

exports.chat = async (req, res, next) => {
  try {
    const { message, learning_path_id, topic_id } = req.body;
    const userId = req.user.id;

    const lastTest = await DiagnosticTest.findOne({ user_id: userId, status: 'completed' })
      .sort({ completed_at: -1 })
      .select('level_assigned');
    const studentLevel = lastTest?.level_assigned || 'beginner';

    const historyFilter = { user_id: userId };
    if (learning_path_id) historyFilter.learning_path_id = learning_path_id;
    const history = await AiInteraction.find(historyFilter)
      .sort({ created_at: -1 })
      .limit(10)
      .select('role content');
    const chatHistory = history.reverse().map(h => ({ role: h.role, content: h.content }));

    let context = '';
    if (learning_path_id) {
      const path = await LearningPath.findById(learning_path_id).select('title');
      context = path?.title || '';
    }

    const aiResponse = await aiService.explainConcept({ concept: message, studentLevel, context, chatHistory });

    await AiInteraction.create({
      user_id: userId, learning_path_id: learning_path_id || null,
      topic_title: topic_id || null, role: 'user', content: message,
    });
    await AiInteraction.create({
      user_id: userId, learning_path_id: learning_path_id || null,
      topic_title: topic_id || null, role: 'assistant', content: aiResponse,
    });

    return success(res, { response: aiResponse, student_level: studentLevel });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { learning_path_id, limit = 50 } = req.query;
    const filter = { user_id: req.user.id };
    if (learning_path_id) filter.learning_path_id = learning_path_id;

    const history = await AiInteraction.find(filter)
      .sort({ created_at: 1 })
      .limit(Math.min(parseInt(limit) || 50, 200));

    return success(res, history);
  } catch (err) { next(err); }
};
