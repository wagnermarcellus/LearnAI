const { query }          = require('../config/database');
const { success, error } = require('../utils/response');

// GET /learning-paths
exports.getAll = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        lp.*,
        u.name                    AS created_by_name,
        COUNT(DISTINCT t.id)      AS topic_count,
        COUNT(DISTINCT e.user_id) AS enrolled_count
      FROM learning_paths lp
      LEFT JOIN users      u ON u.id = lp.created_by
      LEFT JOIN topics     t ON t.learning_path_id = lp.id
      LEFT JOIN enrollments e ON e.learning_path_id = lp.id
      WHERE lp.is_active = true
      GROUP BY lp.id, u.name
      ORDER BY lp.created_at DESC
    `);
    return success(res, result.rows);
  } catch (err) { next(err); }
};

// GET /learning-paths/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pathResult = await query(`
      SELECT lp.*, u.name AS created_by_name
      FROM learning_paths lp
      LEFT JOIN users u ON u.id = lp.created_by
      WHERE lp.id = $1
    `, [id]);

    if (!pathResult.rows[0]) return error(res, 'Trilha não encontrada', 404);

    const topicsResult = await query(`
      SELECT
        t.*,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name, 'description', s.description)
            ORDER BY s.order_index
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS skills
      FROM topics t
      LEFT JOIN skills s ON s.topic_id = t.id
      WHERE t.learning_path_id = $1
      GROUP BY t.id
      ORDER BY t.order_index
    `, [id]);

    const data = { ...pathResult.rows[0], topics: topicsResult.rows };

    // Verifica inscrição se for aluno
    if (req.user?.role === 'student') {
      const enr = await query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND learning_path_id = $2',
        [req.user.id, id]
      );
      data.is_enrolled = enr.rows.length > 0;
    }

    return success(res, data);
  } catch (err) { next(err); }
};

// POST /learning-paths  (admin)
exports.create = async (req, res, next) => {
  try {
    const { title, description, thumbnail, topics = [] } = req.body;

    const pathResult = await query(
      'INSERT INTO learning_paths (title, description, thumbnail, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, description || null, thumbnail || null, req.user.id]
    );
    const path = pathResult.rows[0];

    for (let i = 0; i < topics.length; i++) {
      const tp = topics[i];
      const topicResult = await query(
        'INSERT INTO topics (learning_path_id, title, description, order_index) VALUES ($1,$2,$3,$4) RETURNING id',
        [path.id, tp.title, tp.description || null, i]
      );
      const topicId = topicResult.rows[0].id;

      for (let j = 0; j < (tp.skills || []).length; j++) {
        const sk = tp.skills[j];
        if (sk.name) {
          await query(
            'INSERT INTO skills (topic_id, name, description, order_index) VALUES ($1,$2,$3,$4)',
            [topicId, sk.name, sk.description || null, j]
          );
        }
      }
    }

    return success(res, path, 'Trilha criada com sucesso', 201);
  } catch (err) { next(err); }
};

// PUT /learning-paths/:id  (admin)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, is_active } = req.body;

    const result = await query(`
      UPDATE learning_paths
      SET title=$1, description=$2, thumbnail=$3, is_active=$4
      WHERE id=$5
      RETURNING *
    `, [title, description, thumbnail, is_active, id]);

    if (!result.rows[0]) return error(res, 'Trilha não encontrada', 404);
    return success(res, result.rows[0], 'Trilha atualizada');
  } catch (err) { next(err); }
};

// POST /learning-paths/:id/enroll  (student)
exports.enroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pathExists = await query(
      'SELECT id FROM learning_paths WHERE id=$1 AND is_active=true', [id]
    );
    if (!pathExists.rows[0]) return error(res, 'Trilha não encontrada', 404);

    await query(
      'INSERT INTO enrollments (user_id, learning_path_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );

    return success(res, null, 'Inscrição realizada com sucesso');
  } catch (err) { next(err); }
};

// GET /learning-paths/my-enrollments  (student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT lp.*, e.enrolled_at, e.completed_at
      FROM enrollments e
      JOIN learning_paths lp ON lp.id = e.learning_path_id
      WHERE e.user_id = $1
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);

    return success(res, result.rows);
  } catch (err) { next(err); }
};
