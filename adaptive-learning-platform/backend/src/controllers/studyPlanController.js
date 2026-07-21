const { query }          = require('../config/database');
const { success, error } = require('../utils/response');
const aiService          = require('../services/aiService');

exports.generate = async (req, res, next) => {
  try {
    const { learning_path_id, goals } = req.body;
    const userId = req.user.id;

    const testResult = await query(`
      SELECT dt.*, lp.title AS path_title
      FROM diagnostic_tests dt
      JOIN learning_paths lp ON lp.id = dt.learning_path_id
      WHERE dt.user_id=$1 AND dt.learning_path_id=$2 AND dt.status='completed'
      ORDER BY dt.completed_at DESC
      LIMIT 1
    `, [userId, learning_path_id]);

    const test = testResult.rows[0];
    if (!test) return error(res, 'Complete uma avaliação diagnóstica antes de gerar o plano', 400);

    const topicsResult = await query(
      'SELECT title FROM topics WHERE learning_path_id=$1 ORDER BY order_index', [learning_path_id]
    );

    const weakResult = await query(`
      SELECT t.title, COUNT(*) AS errors
      FROM student_answers sa
      JOIN questions q ON q.id  = sa.question_id
      JOIN topics    t ON t.id  = q.topic_id
      WHERE sa.diagnostic_test_id=$1 AND sa.is_correct=false
      GROUP BY t.title
      ORDER BY errors DESC
      LIMIT 5
    `, [test.id]);
    const weaknesses = weakResult.rows.map(r => r.title);

    const plan = await aiService.generateStudyPlan({
      studentName: req.user.name,
      pathTitle:   test.path_title,
      level:       test.level_assigned,
      weaknesses,
      goals:       goals || null,
      topics:      topicsResult.rows,
    });

    await query(
      'UPDATE study_plans SET is_active=false WHERE user_id=$1 AND learning_path_id=$2',
      [userId, learning_path_id]
    );

    const planResult = await query(`
      INSERT INTO study_plans (user_id, learning_path_id, diagnostic_test_id, content, goals)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [userId, learning_path_id, test.id, JSON.stringify(plan), goals || null]);

    return success(res, planResult.rows[0], 'Plano de estudo gerado com sucesso', 201);
  } catch (err) { next(err); }
};

exports.getMy = async (req, res, next) => {
  try {
    const { learning_path_id } = req.query;
    const params = [req.user.id];
    let sql = `
      SELECT sp.*, lp.title AS path_title
      FROM study_plans sp
      JOIN learning_paths lp ON lp.id = sp.learning_path_id
      WHERE sp.user_id=$1 AND sp.is_active=true
    `;
    if (learning_path_id) { sql += ' AND sp.learning_path_id=$2'; params.push(learning_path_id); }
    sql += ' ORDER BY sp.created_at DESC';

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) { next(err); }
};
