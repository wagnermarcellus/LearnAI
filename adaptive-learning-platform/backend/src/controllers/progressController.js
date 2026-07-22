const User            = require('../models/User');
const DiagnosticTest  = require('../models/DiagnosticTest');
const Enrollment      = require('../models/Enrollment');
const UserBadge       = require('../models/UserBadge');
const XpEvent         = require('../models/XpEvent');
const AiInteraction   = require('../models/AiInteraction');
const LearningPath    = require('../models/LearningPath');
const { success }     = require('../utils/response');
const aiService       = require('../services/aiService');

exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [user, tests, enrollments, badges, xpEvents, aiCount] = await Promise.all([
      User.findById(userId).select('name xp level'),
      DiagnosticTest.find({ user_id: userId, status: 'completed' })
        .sort({ completed_at: -1 })
        .populate('learning_path_id', 'title'),
      Enrollment.find({ user_id: userId }).populate('learning_path_id', 'title'),
      UserBadge.find({ user_id: userId }),
      XpEvent.find({ user_id: userId }).sort({ created_at: -1 }).limit(20),
      AiInteraction.countDocuments({ user_id: userId, role: 'user' }),
    ]);

    return success(res, {
      user,
      tests: tests.map(t => ({
        score:          t.score,
        level_assigned: t.level_assigned,
        completed_at:   t.completed_at,
        type:           t.type,
        path_title:     t.learning_path_id?.title || null,
      })),
      enrollments: enrollments
        .filter(e => e.learning_path_id)
        .map(e => ({
          title:        e.learning_path_id.title,
          id:           e.learning_path_id.id,
          enrolled_at:  e.enrolled_at,
          completed_at: e.completed_at,
        })),
      badges,
      xp_events:       xpEvents,
      ai_interactions: aiCount,
    });
  } catch (err) { next(err); }
};

exports.requestProgressTest = async (req, res, next) => {
  try {
    const { learning_path_id } = req.body;
    const userId = req.user.id;

    const lastTest = await DiagnosticTest.findOne({
      user_id: userId, learning_path_id, status: 'completed',
    }).sort({ completed_at: -1 });

    if (!lastTest) {
      return success(res, null, 'Complete uma avaliação diagnóstica primeiro');
    }

    const { score, level_assigned } = lastTest;
    const path = await LearningPath.findById(learning_path_id);

    const aiResponse = await aiService.generateProgressTest({
      pathTitle:     path?.title || '',
      topics:        [...path.topics].sort((a, b) => a.order_index - b.order_index).map(t => t.title),
      studentLevel:  level_assigned,
      previousScore: score,
    });

    const questionDocs = aiResponse.questions.map((q, i) => ({
      question_text:  q.question_text,
      options:        q.options,
      correct_option: q.correct_option,
      difficulty:     q.difficulty,
      explanation:    q.explanation || null,
      order_index:    i,
    }));

    const test = await DiagnosticTest.create({
      user_id: userId,
      learning_path_id,
      ai_raw_response: aiResponse,
      status: 'pending',
      type: 'progress',
      questions: questionDocs,
    });

    const questions = test.questions.map(q => ({
      id:                 q.id,
      diagnostic_test_id: test.id,
      question_text:      q.question_text,
      options:            q.options,
      difficulty:         q.difficulty,
      order_index:        q.order_index,
    }));

    return success(res, { test, questions }, 'Avaliação de progresso gerada', 201);
  } catch (err) { next(err); }
};
