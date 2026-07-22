const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const xpEventSchema = new Schema({
  user_id:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  xp_gained:  { type: Number, required: true },
  reason:     { type: String, required: true, maxlength: 100 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

withIdJSON(xpEventSchema);

module.exports = model('XpEvent', xpEventSchema);
