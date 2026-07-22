const LearningPath        = require('../models/LearningPath');
const Enrollment          = require('../models/Enrollment');
const { success, error }  = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const paths = await LearningPath.find({ is_active: true })
      .sort({ created_at: -1 })
      .populate('created_by', 'name');

    const enrolledCounts = await Enrollment.aggregate([
      { $group: { _id: '$learning_path_id', count: { $sum: 1 } } },
    ]);
    const countsByPath = Object.fromEntries(
      enrolledCounts.map(c => [c._id.toString(), c.count])
    );

    const data = paths.map(p => ({
      ...p.toJSON(),
      created_by_name: p.created_by?.name || null,
      created_by:      p.created_by?.id || p.created_by,
      topic_count:     p.topics.length,
      enrolled_count:  countsByPath[p.id] || 0,
    }));

    return success(res, data);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const path = await LearningPath.findById(id).populate('created_by', 'name');
    if (!path) return error(res, 'Trilha não encontrada', 404);

    const data = {
      ...path.toJSON(),
      created_by_name: path.created_by?.name || null,
      created_by:      path.created_by?.id || path.created_by,
    };

    if (req.user?.role === 'student') {
      const enr = await Enrollment.findOne({ user_id: req.user.id, learning_path_id: id });
      data.is_enrolled = !!enr;
    }

    return success(res, data);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, thumbnail, topics = [] } = req.body;

    const path = await LearningPath.create({
      title,
      description: description || null,
      thumbnail: thumbnail || null,
      created_by: req.user.id,
      topics: topics.map(tp => ({
        title: tp.title,
        description: tp.description || null,
        skills: (tp.skills || []).filter(sk => sk.name).map(sk => ({
          name: sk.name,
          description: sk.description || null,
        })),
      })),
    });

    return success(res, path, 'Trilha criada com sucesso', 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, is_active } = req.body;

    const path = await LearningPath.findByIdAndUpdate(
      id,
      { title, description, thumbnail, is_active },
      { new: true, runValidators: true }
    );

    if (!path) return error(res, 'Trilha não encontrada', 404);
    return success(res, path, 'Trilha atualizada');
  } catch (err) { next(err); }
};

exports.enroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pathExists = await LearningPath.exists({ _id: id, is_active: true });
    if (!pathExists) return error(res, 'Trilha não encontrada', 404);

    await Enrollment.updateOne(
      { user_id: req.user.id, learning_path_id: id },
      { $setOnInsert: { user_id: req.user.id, learning_path_id: id } },
      { upsert: true }
    );

    return success(res, null, 'Inscrição realizada com sucesso');
  } catch (err) { next(err); }
};

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user_id: req.user.id })
      .sort({ enrolled_at: -1 })
      .populate('learning_path_id');

    const data = enrollments
      .filter(e => e.learning_path_id)
      .map(e => ({
        ...e.learning_path_id.toJSON(),
        enrolled_at:  e.enrolled_at,
        completed_at: e.completed_at,
      }));

    return success(res, data);
  } catch (err) { next(err); }
};
