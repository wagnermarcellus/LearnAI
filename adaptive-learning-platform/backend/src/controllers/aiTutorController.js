const { query }   = require('../config/database');
const { success } = require('../utils/response');
const aiService   = require('../services/aiService');

exports.chat = async (req, res, next) => {
  try {
    const { message, learning_path_id, topic_id } = req.body;
    const userId = req.user.id;

    const levelResult = await query(`
      SELECT level_assigned FROM diagnostic_tests
      WHERE user_id=$1 AND status='completed'
      ORDER BY completed_at DESC LIMIT 1
    `, [userId]);
    const studentLevel = levelResult.rows[0]?.level_assigned || 'beginner';

    const params = [userId];
    let historySql = 'SELECT role, content FROM ai_interactions WHERE user_id=$1';
    if (learning_path_id) { historySql += ' AND learning_path_id=$2'; params.push(learning_path_id); }
    historySql += ' ORDER BY created_at DESC LIMIT 10';
    const historyResult = await query(historySql, params);
    const chatHistory = historyResult.rows.reverse();

    let context = '';
    if (learning_path_id) {
      const pathResult = await query('SELECT title FROM learning_paths WHERE id=$1', [learning_path_id]);
      context = pathResult.rows[0]?.title || '';
    }

    const aiResponse = await aiService.explainConcept({ concept: message, studentLevel, context, chatHistory });

    await query(
      'INSERT INTO ai_interactions (user_id, learning_path_id, topic_id, role, content) VALUES ($1,$2,$3,$4,$5)',
      [userId, learning_path_id || null, topic_id || null, 'user', message]
    );
    await query(
      'INSERT INTO ai_interactions (user_id, learning_path_id, topic_id, role, content) VALUES ($1,$2,$3,$4,$5)',
      [userId, learning_path_id || null, topic_id || null, 'assistant', aiResponse]
    );

    return success(res, { response: aiResponse, student_level: studentLevel });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { learning_path_id, limit = 50 } = req.query;
    const params = [req.user.id];
    let sql = 'SELECT * FROM ai_interactions WHERE user_id=$1';
    if (learning_path_id) { sql += ' AND learning_path_id=$2'; params.push(learning_path_id); }
    sql += ` ORDER BY created_at ASC LIMIT ${Math.min(parseInt(limit) || 50, 200)}`;

    const result = await query(sql, params);
    return success(res, result.rows);
  } catch (err) { next(err); }
};
