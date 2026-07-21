const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { query }      = require('../config/database');
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

    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return error(res, 'E-mail já cadastrado', 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, name, email, role, xp, level, created_at`,
      [name, email, passwordHash]
    );

    const user  = result.rows[0];
    const token = generateToken(user);

    logger.info('Novo usuário registrado', { userId: user.id, email });
    return success(res, { user, token }, 'Conta criada com sucesso', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password_hash, role, xp, level, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user)           return error(res, 'Credenciais inválidas', 401);
    if (!user.is_active) return error(res, 'Conta desativada', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Credenciais inválidas', 401);

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    logger.info('Login realizado', { userId: user.id });
    return success(res, { user: safeUser, token }, 'Login realizado com sucesso');
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, avatar_url, xp, level, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return error(res, 'Usuário não encontrado', 404);
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};
