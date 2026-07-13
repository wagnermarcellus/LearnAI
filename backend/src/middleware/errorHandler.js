const logger = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Error handler global do Express.
 * Captura todos os erros não tratados nas rotas/controllers.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack:  err.stack,
    path:   req.path,
    method: req.method,
  });

  // Violação de unique constraint (PostgreSQL)
  if (err.code === '23505') return error(res, 'Recurso já existe', 409);

  // Foreign key violation
  if (err.code === '23503') return error(res, 'Recurso referenciado não encontrado', 400);

  // Erros de sintaxe no JSON do body
  if (err.type === 'entity.parse.failed') return error(res, 'JSON inválido no corpo da requisição', 400);

  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message;

  return error(res, message, err.statusCode || 500);
};

module.exports = errorHandler;
