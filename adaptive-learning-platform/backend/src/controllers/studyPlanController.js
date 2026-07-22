const StudyPlan           = require('../models/StudyPlan');
const DiagnosticTest      = require('../models/DiagnosticTest');
const LearningPath        = require('../models/LearningPath');
const { success, error }  = require('../utils/response');
const aiService           = require('../services/aiService');
const { awardBadge }      = require('../utils/badges');

exports.generate = async (req, res, next) => {
  try {
    const { learning_path_id, goals } = req.body;
    const userId = req.user.id;

    const test = await DiagnosticTest.findOne({
      user_id: userId, learning_path_id, status: 'completed',
    }).sort({ completed_at: -1 }).populate('learning_path_id', 'title topics');

    if (!test) return error(res, 'Complete uma avaliação diagnóstica antes de gerar o plano', 400);

    const path = test.learning_path_id;
    const topics = [...path.topics].sort((a, b) => a.order_index - b.order_index);

    const questionsMap = {};
    test.questions.forEach(q => { questionsMap[q.id] = q; });

    const errorCounts = {};
    test.answers.filter(a => !a.is_correct).forEach(a => {
      const title = questionsMap[a.question_id.toString()]?.topic_title;
      if (!title) return;
      errorCounts[title] = (errorCounts[title] || 0) + 1;
    });
    const weaknesses = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title]) => title);

    const plan = await aiService.generateStudyPlan({
      studentName: req.user.name,
      pathTitle:   path.title,
      level:       test.level_assigned,
      weaknesses,
      goals:       goals || null,
      topics,
    });

    await StudyPlan.updateMany(
      { user_id: userId, learning_path_id },
      { is_active: false }
    );

    const studyPlan = await StudyPlan.create({
      user_id: userId,
      learning_path_id,
      diagnostic_test_id: test.id,
      content: plan,
      goals: goals || null,
    });

    const planCount = await StudyPlan.countDocuments({ user_id: userId });
    if (planCount === 1) await awardBadge(userId, 'primeiro_plano');

    return success(res, studyPlan, 'Plano de estudo gerado com sucesso', 201);
  } catch (err) { next(err); }
};

exports.getMy = async (req, res, next) => {
  try {
    const { learning_path_id } = req.query;
    const filter = { user_id: req.user.id, is_active: true };
    if (learning_path_id) filter.learning_path_id = learning_path_id;

    const plans = await StudyPlan.find(filter)
      .sort({ created_at: -1 })
      .populate('learning_path_id', 'title');

    const data = plans.map(p => ({
      ...p.toJSON(),
      path_title:       p.learning_path_id?.title || null,
      learning_path_id: p.learning_path_id?.id || p.learning_path_id,
    }));

    return success(res, data);
  } catch (err) { next(err); }
};
