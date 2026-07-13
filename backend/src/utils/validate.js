const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

/**
 * Middleware que verifica os resultados do express-validator.
 * Use após as regras de validação em cada rota.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Erro de validação', 422, errors.array());
  }
  next();
};

module.exports = validate;
