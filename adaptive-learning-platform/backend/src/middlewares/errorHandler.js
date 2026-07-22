const logger    = require('../utils/logger');
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  if (err.code === 11000) return error(res, 'Recurso já existe', 409);
  if (err.name === 'ValidationError') return error(res, 'Erro de validação', 422, Object.values(err.errors).map(e => e.message));
  if (err.name === 'CastError') return error(res, 'Identificador inválido', 400);
  if (err.type === 'entity.parse.failed') return error(res, 'JSON inválido no corpo da requisição', 400);

  const message = process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message;
  return error(res, message, err.statusCode || 500);
};

module.exports = errorHandler;
