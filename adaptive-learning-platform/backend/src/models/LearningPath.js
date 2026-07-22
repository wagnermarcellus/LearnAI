const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const skillSchema = new Schema({
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: null },
  order_index: { type: Number, default: 0 },
});
withIdJSON(skillSchema);

const topicSchema = new Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: null },
  order_index: { type: Number, default: 0 },
  skills:      [skillSchema],
});
withIdJSON(topicSchema);

const learningPathSchema = new Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: null },
  thumbnail:   { type: String, default: null },
  created_by:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  is_active:   { type: Boolean, default: true },
  topics:      [topicSchema],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

withIdJSON(learningPathSchema);

module.exports = model('LearningPath', learningPathSchema);
