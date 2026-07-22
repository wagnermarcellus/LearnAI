const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/diagnosticController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/my-tests', authenticate, ctrl.getMyTests);

router.post('/generate', authenticate, authorize('student'), [
  body('learning_path_id').isMongoId().withMessage('ID da trilha inválido'),
], validate, ctrl.generateTest);

router.post('/submit', authenticate, authorize('student'), [
  body('test_id').isMongoId().withMessage('ID do teste inválido'),
  body('answers').isArray({ min: 1 }).withMessage('Respostas obrigatórias'),
  body('answers.*.question_id').isMongoId(),
  body('answers.*.selected_option').isIn(['A', 'B', 'C', 'D']),
], validate, ctrl.submitAnswers);

router.get('/:id/result', authenticate, ctrl.getTestResult);

module.exports = router;
