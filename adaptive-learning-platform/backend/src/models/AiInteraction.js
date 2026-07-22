const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const aiInteractionSchema = new Schema({
  user_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  learning_path_id: { type: Schema.Types.ObjectId, ref: 'LearningPath', default: null },
  topic_title:      { type: String, default: null },
  role:             { type: String, required: true, maxlength: 20 },
  content:          { type: String, required: true },
  tokens_used:      { type: Number, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

aiInteractionSchema.index({ user_id: 1, created_at: -1 });
withIdJSON(aiInteractionSchema);

module.exports = model('AiInteraction', aiInteractionSchema);
