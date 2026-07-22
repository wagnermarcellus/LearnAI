const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];

const questionSchema = new Schema({
  topic_title:    { type: String, default: null },
  question_text:  { type: String, required: true },
  options:        { type: Schema.Types.Mixed, required: true },
  correct_option: { type: String, required: true },
  difficulty:     { type: String, enum: DIFFICULTIES, default: 'beginner' },
  explanation:    { type: String, default: null },
  order_index:    { type: Number, default: 0 },
});
withIdJSON(questionSchema);

const answerSchema = new Schema({
  question_id:     { type: Schema.Types.ObjectId, required: true },
  user_id:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  selected_option: { type: String, required: true },
  is_correct:      { type: Boolean, required: true },
  answered_at:     { type: Date, default: Date.now },
});
withIdJSON(answerSchema);

const diagnosticTestSchema = new Schema({
  user_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  learning_path_id: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  type:             { type: String, enum: ['diagnostic', 'progress', 'final'], default: 'diagnostic' },
  status:           { type: String, enum: ['pending', 'completed'], default: 'pending' },
  ai_raw_response:  { type: Schema.Types.Mixed, default: null },
  score:            { type: Number, default: null },
  level_assigned:   { type: String, enum: DIFFICULTIES, default: null },
  questions:        [questionSchema],
  answers:          [answerSchema],
  completed_at:     { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

diagnosticTestSchema.index({ user_id: 1, created_at: -1 });
withIdJSON(diagnosticTestSchema);

module.exports = model('DiagnosticTest', diagnosticTestSchema);
