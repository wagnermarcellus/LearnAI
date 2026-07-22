const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const User           = require('../models/User');
const { success, error } = require('../utils/response');
const logger         = require('../utils/logger');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return error(res, 'E-mail já cadastrado', 409);

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, password_hash, role: 'student' });
    const safeUser = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      xp: user.xp, level: user.level, created_at: user.created_at,
    };
    const token = generateToken(safeUser);

    logger.info('Novo usuário registrado', { userId: user.id, email });
    return success(res, { user: safeUser, token }, 'Conta criada com sucesso', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)             return error(res, 'Credenciais inválidas', 401);
    if (!user.is_active)   return error(res, 'Conta desativada', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Credenciais inválidas', 401);

    const safeUser = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      xp: user.xp, level: user.level, is_active: user.is_active,
    };
    const token = generateToken(safeUser);

    logger.info('Login realizado', { userId: user.id });
    return success(res, { user: safeUser, token }, 'Login realizado com sucesso');
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      'name email role avatar_url xp level created_at'
    );
    if (!user) return error(res, 'Usuário não encontrado', 404);
    return success(res, user);
  } catch (err) { next(err); }
};
