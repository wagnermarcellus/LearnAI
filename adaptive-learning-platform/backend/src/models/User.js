const { Schema, model } = require('mongoose');
const withIdJSON         = require('./plugins/toJSON');

const userSchema = new Schema({
  name:          { type: String, required: true, trim: true, maxlength: 150 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role:          { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar_url:    { type: String, default: null },
  xp:            { type: Number, default: 0 },
  level:         { type: Number, default: 1 },
  is_active:     { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

withIdJSON(userSchema);

module.exports = model('User', userSchema);
