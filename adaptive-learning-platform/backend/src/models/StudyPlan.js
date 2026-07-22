const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const studyPlanSchema = new Schema({
  user_id:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
  learning_path_id:   { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  diagnostic_test_id: { type: Schema.Types.ObjectId, ref: 'DiagnosticTest', default: null },
  content:            { type: Schema.Types.Mixed, required: true },
  goals:              { type: String, default: null },
  is_active:          { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

withIdJSON(studyPlanSchema);

module.exports = model('StudyPlan', studyPlanSchema);
