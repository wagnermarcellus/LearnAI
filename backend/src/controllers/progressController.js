const { query }   = require('../config/database');
const { success } = require('../utils/response');
const aiService   = require('../services/aiService');

// GET /progress/overview
exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRes, testsRes, enrollRes, badgesRes, xpRes, aiRes] = await Promise.all([
      query('SELECT name, xp, level FROM users WHERE id=$1', [userId]),
      query(`
        SELECT dt.score, dt.level_assigned, dt.completed_at, dt.type, lp.title AS path_title
        FROM diagnostic_tests dt
        JOIN learning_paths lp ON lp.id=dt.learning_path_id
        WHERE dt.user_id=$1 AND dt.status='completed'
        ORDER BY dt.completed_at DESC
      `, [userId]),
      query(`
        SELECT lp.title, lp.id, e.enrolled_at, e.completed_at
        FROM enrollments e
        JOIN learning_paths lp ON lp.id=e.learning_path_id
        WHERE e.user_id=$1
      `, [userId]),
      query('SELECT * FROM user_badges WHERE user_id=$1', [userId]),
      query('SELECT xp_gained, reason, created_at FROM xp_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [userId]),
      query("SELECT COUNT(*) AS count FROM ai_interactions WHERE user_id=$1 AND role='user'", [userId]),
    ]);

    return success(res, {
      user:            userRes.rows[0],
      tests:           testsRes.rows,
      enrollments:     enrollRes.rows,
      badges:          badgesRes.rows,
      xp_events:       xpRes.rows,
      ai_interactions: parseInt(aiRes.rows[0].count),
    });
  } catch (err) { next(err); }
};

// POST /progress/test
exports.requestProgressTest = async (req, res, next) => {
  try {
    const { learning_path_id } = req.body;
    const userId = req.user.id;

    const lastTest = await query(`
      SELECT score, level_assigned FROM diagnostic_tests
      WHERE user_id=$1 AND learning_path_id=$2 AND status='completed'
      ORDER BY completed_at DESC LIMIT 1
    `, [userId, learning_path_id]);

    if (!lastTest.rows[0]) {
      return success(res, null, 'Complete uma avaliação diagnóstica primeiro');
    }

    const { score, level_assigned } = lastTest.rows[0];
    const [pathRes, topicsRes] = await Promise.all([
      query('SELECT title FROM learning_paths WHERE id=$1', [learning_path_id]),
      query('SELECT title FROM topics WHERE learning_path_id=$1 ORDER BY order_index', [learning_path_id]),
    ]);

    const aiResponse = await aiService.generateProgressTest({
      pathTitle:     pathRes.rows[0].title,
      topics:        topicsRes.rows.map(t => t.title),
      studentLevel:  level_assigned,
      previousScore: score,
    });

    const testResult = await query(`
      INSERT INTO diagnostic_tests (user_id, learning_path_id, ai_raw_response, status, type)
      VALUES ($1,$2,$3,'pending','progress') RETURNING *
    `, [userId, learning_path_id, JSON.stringify(aiResponse)]);
    const test = testResult.rows[0];

    const questions = [];
    for (let i = 0; i < aiResponse.questions.length; i++) {
      const q = aiResponse.questions[i];
      const qResult = await query(`
        INSERT INTO questions
          (diagnostic_test_id, question_text, options, correct_option, difficulty, explanation, order_index)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, diagnostic_test_id, question_text, options, difficulty, order_index
      `, [test.id, q.question_text, JSON.stringify(q.options), q.correct_option, q.difficulty, q.explanation || null, i]);
      questions.push(qResult.rows[0]);
    }

    return success(res, { test, questions }, 'Avaliação de progresso gerada', 201);
  } catch (err) { next(err); }
};
