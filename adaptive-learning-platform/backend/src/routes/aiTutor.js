const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/aiTutorController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/chat', authenticate, [
  body('message')
    .trim().notEmpty().withMessage('Mensagem obrigatória')
    .isLength({ max: 2000 }).withMessage('Mensagem muito longa (máx. 2000 caracteres)'),
  body('learning_path_id').optional().isUUID(),
  body('topic_id').optional().isUUID(),
], validate, ctrl.chat);

router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;
