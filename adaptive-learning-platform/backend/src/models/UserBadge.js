const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const userBadgeSchema = new Schema({
  user_id:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badge:      { type: String, required: true, maxlength: 50 },
  earned_at:  { type: Date, default: Date.now },
});

userBadgeSchema.index({ user_id: 1, badge: 1 }, { unique: true });
withIdJSON(userBadgeSchema);

module.exports = model('UserBadge', userBadgeSchema);
