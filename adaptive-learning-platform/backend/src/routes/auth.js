const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/register', [
  body('name')
    .trim().notEmpty().withMessage('Nome obrigatório')
    .isLength({ min: 2, max: 150 }).withMessage('Nome: 2 a 150 caracteres'),
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Senha: mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve ter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve ter ao menos um número'),
], validate, ctrl.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Senha obrigatória'),
], validate, ctrl.login);

router.get('/me', authenticate, ctrl.me);

module.exports = router;
