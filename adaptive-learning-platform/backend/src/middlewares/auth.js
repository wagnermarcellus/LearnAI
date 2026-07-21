const jwt            = require('jsonwebtoken');
const { error }      = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token de acesso obrigatório', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token expirado', 401);
    return error(res, 'Token inválido', 401);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'Permissão insuficiente', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
