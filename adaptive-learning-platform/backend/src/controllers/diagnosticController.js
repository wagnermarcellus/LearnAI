const { query }          = require('../config/database');
const { success, error } = require('../utils/response');
const aiService          = require('../services/aiService');

exports.generateTest = async (req, res, next) => {
  try {
    const { learning_path_id } = req.body;
    const userId = req.user.id;

    const enr = await query(
      'SELECT id FROM enrollments WHERE user_id=$1 AND learning_path_id=$2',
      [userId, learning_path_id]
    );
    if (!enr.rows[0]) return error(res, 'Você precisa se inscrever na trilha primeiro', 400);

    const pathResult   = await query('SELECT * FROM learning_paths WHERE id=$1', [learning_path_id]);
    const topicsResult = await query(
      'SELECT * FROM topics WHERE learning_path_id=$1 ORDER BY order_index', [learning_path_id]
    );
    const path   = pathResult.rows[0];
    const topics = topicsResult.rows;

    const aiResponse = await aiService.generateDiagnosticQuestions({
      pathTitle: path.title,
      topics,
      numQuestions: 10,
    });

    const testResult = await query(`
      INSERT INTO diagnostic_tests (user_id, learning_path_id, ai_raw_response, status, type)
      VALUES ($1, $2, $3, 'pending', 'diagnostic') RETURNING *
    `, [userId, learning_path_id, JSON.stringify(aiResponse)]);
    const test = testResult.rows[0];

    const questions = [];
    for (let i = 0; i < aiResponse.questions.length; i++) {
      const q          = aiResponse.questions[i];
      const topicMatch = topics.find(t =>
        t.title.toLowerCase().includes((q.topic || '').toLowerCase())
      );

      const qResult = await query(`
        INSERT INTO questions
          (diagnostic_test_id, topic_id, question_text, options, correct_option, difficulty, explanation, order_index)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, diagnostic_test_id, topic_id, question_text, options, difficulty, order_index
      `, [
        test.id,
        topicMatch?.id || null,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_option,
        q.difficulty,
        q.explanation || null,
        i,
      ]);
      questions.push(qResult.rows[0]);
    }

    return success(res, { test, questions }, 'Avaliação gerada com sucesso', 201);
  } catch (err) { next(err); }
};

exports.submitAnswers = async (req, res, next) => {
  try {
    const { test_id, answers } = req.body;
    const userId = req.user.id;

    const testResult = await query(
      "SELECT * FROM diagnostic_tests WHERE id=$1 AND user_id=$2 AND status='pending'",
      [test_id, userId]
    );
    const test = testResult.rows[0];
    if (!test) return error(res, 'Teste não encontrado ou já respondido', 404);

    const questionsResult = await query(
      'SELECT id, correct_option, difficulty, topic_id FROM questions WHERE diagnostic_test_id=$1',
      [test_id]
    );
    const questionsMap = {};
    questionsResult.rows.forEach(q => { questionsMap[q.id] = q; });

    let correct = 0;
    const topicScores = {};

    for (const ans of answers) {
      const q = questionsMap[ans.question_id];
      if (!q) continue;

      const isCorrect = q.correct_option === ans.selected_option;
      if (isCorrect) correct++;

      const key = q.topic_id || 'geral';
      if (!topicScores[key]) topicScores[key] = { correct: 0, total: 0 };
      topicScores[key].total++;
      if (isCorrect) topicScores[key].correct++;

      await query(`
        INSERT INTO student_answers
          (diagnostic_test_id, question_id, user_id, selected_option, is_correct)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (diagnostic_test_id, question_id, user_id) DO NOTHING
      `, [test_id, ans.question_id, userId, ans.selected_option, isCorrect]);
    }

    const total = questionsResult.rows.length;
    const score = total > 0 ? (correct / total) * 100 : 0;
    const level =
      score >= 85 ? 'expert' :
      score >= 70 ? 'advanced' :
      score >= 50 ? 'intermediate' :
                    'beginner';

    await query(
      "UPDATE diagnostic_tests SET status='completed', score=$1, level_assigned=$2, completed_at=NOW() WHERE id=$3",
      [score.toFixed(2), level, test_id]
    );

    const topicIds = Object.keys(topicScores).filter(k => k !== 'geral');
    const topicNames = {};
    if (topicIds.length) {
      const tRes = await query('SELECT id, title FROM topics WHERE id = ANY($1)', [topicIds]);
      tRes.rows.forEach(t => { topicNames[t.id] = t.title; });
    }
    const topicScoresForAI = Object.entries(topicScores).map(([tid, s]) => ({
      topic:   topicNames[tid] || 'Geral',
      correct: s.correct,
      total:   s.total,
    }));

    const pathResult = await query('SELECT title FROM learning_paths WHERE id=$1', [test.learning_path_id]);
    const analysis = await aiService.analyzePedagogicalPerformance({
      studentName: req.user.name,
      pathTitle:   pathResult.rows[0]?.title || '',
      score:       score.toFixed(1),
      level,
      topicScores: topicScoresForAI,
    });

    await query(
      'UPDATE diagnostic_tests SET ai_raw_response=$1 WHERE id=$2',
      [JSON.stringify(analysis), test_id]
    );

    const xpGained = Math.round(score / 10) * 5;
    if (xpGained > 0) {
      await query('UPDATE users SET xp = xp + $1 WHERE id=$2', [xpGained, userId]);
      await query(
        'INSERT INTO xp_events (user_id, xp_gained, reason) VALUES ($1,$2,$3)',
        [userId, xpGained, 'diagnostic_test']
      );
    }

    return success(res, {
      score:     parseFloat(score.toFixed(2)),
      correct,
      total,
      level,
      analysis,
      xp_gained: xpGained,
      test_id,
    });
  } catch (err) { next(err); }
};

exports.getTestResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testResult = await query(`
      SELECT dt.*, lp.title AS path_title
      FROM diagnostic_tests dt
      JOIN learning_paths lp ON lp.id = dt.learning_path_id
      WHERE dt.id=$1 AND dt.user_id=$2
    `, [id, req.user.id]);

    if (!testResult.rows[0]) return error(res, 'Resultado não encontrado', 404);

    const answers = await query(`
      SELECT sa.*, q.question_text, q.options, q.correct_option, q.explanation, q.difficulty
      FROM student_answers sa
      JOIN questions q ON q.id = sa.question_id
      WHERE sa.diagnostic_test_id=$1
      ORDER BY q.order_index
    `, [id]);

    const test = testResult.rows[0];
    try {
      test.analysis = test.ai_raw_response ? JSON.parse(test.ai_raw_response) : null;
    } catch {
      test.analysis = null;
    }

    return success(res, { test, answers: answers.rows });
  } catch (err) { next(err); }
};

exports.getMyTests = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT dt.id, dt.type, dt.status, dt.score, dt.level_assigned, dt.created_at, dt.completed_at,
             lp.title AS path_title
      FROM diagnostic_tests dt
      JOIN learning_paths lp ON lp.id = dt.learning_path_id
      WHERE dt.user_id=$1
      ORDER BY dt.created_at DESC
    `, [req.user.id]);
    return success(res, result.rows);
  } catch (err) { next(err); }
};
