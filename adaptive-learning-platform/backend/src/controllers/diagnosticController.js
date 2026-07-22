const DiagnosticTest      = require('../models/DiagnosticTest');
const LearningPath        = require('../models/LearningPath');
const Enrollment          = require('../models/Enrollment');
const User                = require('../models/User');
const XpEvent             = require('../models/XpEvent');
const { success, error }  = require('../utils/response');
const aiService           = require('../services/aiService');

exports.generateTest = async (req, res, next) => {
  try {
    const { learning_path_id } = req.body;
    const userId = req.user.id;

    const enr = await Enrollment.findOne({ user_id: userId, learning_path_id });
    if (!enr) return error(res, 'Você precisa se inscrever na trilha primeiro', 400);

    const path = await LearningPath.findById(learning_path_id);
    if (!path) return error(res, 'Trilha não encontrada', 404);

    const topics = [...path.topics].sort((a, b) => a.order_index - b.order_index);

    const aiResponse = await aiService.generateDiagnosticQuestions({
      pathTitle: path.title,
      topics,
      numQuestions: 10,
    });

    const questionDocs = aiResponse.questions.map((q, i) => {
      const topicMatch = topics.find(t =>
        t.title.toLowerCase().includes((q.topic || '').toLowerCase())
      );
      return {
        topic_title:    topicMatch?.title || null,
        question_text:  q.question_text,
        options:        q.options,
        correct_option: q.correct_option,
        difficulty:     q.difficulty,
        explanation:    q.explanation || null,
        order_index:    i,
      };
    });

    const test = await DiagnosticTest.create({
      user_id: userId,
      learning_path_id,
      ai_raw_response: aiResponse,
      status: 'pending',
      type: 'diagnostic',
      questions: questionDocs,
    });

    const questions = test.questions.map(q => ({
      id:                 q.id,
      diagnostic_test_id: test.id,
      topic_title:        q.topic_title,
      question_text:      q.question_text,
      options:            q.options,
      difficulty:         q.difficulty,
      order_index:        q.order_index,
    }));

    return success(res, { test, questions }, 'Avaliação gerada com sucesso', 201);
  } catch (err) { next(err); }
};

exports.submitAnswers = async (req, res, next, testType = 'diagnostic') => {
  try {
    const { answers } = req.body;
    const { id: learning_path_id } = req.params;
    const userId = req.user.id;

    const test = await DiagnosticTest.findOne({
      user_id: userId, learning_path_id, type: testType, status: 'pending',
    }).sort({ created_at: -1 });
    if (!test) return error(res, 'Teste não encontrado ou já respondido', 404);

    const questionsMap = {};
    test.questions.forEach(q => { questionsMap[q.id] = q; });

    let correct = 0;
    const topicScores = {};

    for (const ans of answers) {
      const q = questionsMap[ans.question_id];
      if (!q) continue;

      const isCorrect = q.correct_option === ans.selected_option;
      if (isCorrect) correct++;

      const key = q.topic_title || 'Geral';
      if (!topicScores[key]) topicScores[key] = { correct: 0, total: 0 };
      topicScores[key].total++;
      if (isCorrect) topicScores[key].correct++;

      const alreadyAnswered = test.answers.some(a => a.question_id.toString() === ans.question_id);
      if (!alreadyAnswered) {
        test.answers.push({
          question_id:     ans.question_id,
          user_id:         userId,
          selected_option: ans.selected_option,
          is_correct:      isCorrect,
        });
      }
    }

    const total = test.questions.length;
    const score = total > 0 ? (correct / total) * 100 : 0;
    const level =
      score >= 85 ? 'expert' :
      score >= 70 ? 'advanced' :
      score >= 50 ? 'intermediate' :
                    'beginner';

    test.status         = 'completed';
    test.score          = parseFloat(score.toFixed(2));
    test.level_assigned = level;
    test.completed_at   = new Date();

    const topicScoresForAI = Object.entries(topicScores).map(([topic, s]) => ({
      topic, correct: s.correct, total: s.total,
    }));

    const path = await LearningPath.findById(test.learning_path_id).select('title');
    const analysis = await aiService.analyzePedagogicalPerformance({
      studentName: req.user.name,
      pathTitle:   path?.title || '',
      score:       score.toFixed(1),
      level,
      topicScores: topicScoresForAI,
    });

    test.ai_raw_response = analysis;

    const xpGained = Math.round(score / 10) * 5;
    if (xpGained > 0) {
      await User.updateOne({ _id: userId }, { $inc: { xp: xpGained } });
      await XpEvent.create({ user_id: userId, xp_gained: xpGained, reason: 'diagnostic_test' });
    }

    await test.save();

    return success(res, {
      score: test.score,
      correct,
      total,
      level,
      analysis,
      xp_gained: xpGained,
      test_id: test.id,
    });
  } catch (err) { next(err); }
};

exports.getTestResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    const test = await DiagnosticTest.findOne({ _id: id, user_id: req.user.id })
      .populate('learning_path_id', 'title');
    if (!test) return error(res, 'Resultado não encontrado', 404);

    const questionsMap = {};
    test.questions.forEach(q => { questionsMap[q.id] = q; });

    const answers = [...test.answers]
      .sort((a, b) => (questionsMap[a.question_id.toString()]?.order_index ?? 0)
                    - (questionsMap[b.question_id.toString()]?.order_index ?? 0))
      .map(a => {
        const q = questionsMap[a.question_id.toString()] || {};
        return {
          id:                 a.id,
          diagnostic_test_id: test.id,
          question_id:        a.question_id,
          selected_option:    a.selected_option,
          is_correct:         a.is_correct,
          answered_at:        a.answered_at,
          question_text:      q.question_text,
          options:            q.options,
          correct_option:     q.correct_option,
          explanation:        q.explanation,
          difficulty:         q.difficulty,
        };
      });

    const testData = test.toJSON();
    testData.path_title      = test.learning_path_id?.title || null;
    testData.learning_path_id = test.learning_path_id?.id || test.learning_path_id;
    testData.analysis         = test.ai_raw_response || null;
    delete testData.questions;
    delete testData.answers;

    return success(res, { test: testData, answers });
  } catch (err) { next(err); }
};

exports.getMyTests = async (req, res, next) => {
  try {
    const tests = await DiagnosticTest.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .populate('learning_path_id', 'title');

    const data = tests.map(t => ({
      id:             t.id,
      type:           t.type,
      status:         t.status,
      score:          t.score,
      level_assigned: t.level_assigned,
      created_at:     t.created_at,
      completed_at:   t.completed_at,
      path_title:     t.learning_path_id?.title || null,
    }));

    return success(res, data);
  } catch (err) { next(err); }
};
