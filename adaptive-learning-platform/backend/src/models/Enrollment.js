const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const enrollmentSchema = new Schema({
  user_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  learning_path_id: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  enrolled_at:      { type: Date, default: Date.now },
  completed_at:     { type: Date, default: null },
});

enrollmentSchema.index({ user_id: 1, learning_path_id: 1 }, { unique: true });
withIdJSON(enrollmentSchema);

module.exports = model('Enrollment', enrollmentSchema);
