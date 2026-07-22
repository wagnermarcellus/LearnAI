const router   = require('express').Router();
const { body } = require('express-validator');
const learningPathCtrl = require('../controllers/learningPathController');
const diagnosticCtrl   = require('../controllers/diagnosticController');
const progressCtrl     = require('../controllers/progressController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const answersValidation = [
  body('answers').isArray({ min: 1 }).withMessage('Respostas obrigatórias'),
  body('answers.*.question_id').isMongoId(),
  body('answers.*.selected_option').isIn(['A', 'B', 'C', 'D']),
];

// ---- Avaliações (diagnóstico / progresso) — precisam vir antes de "/:id" ----

router.get('/diagnostic',     authenticate, diagnosticCtrl.getMyTests);
router.get('/diagnostic/:id', authenticate, diagnosticCtrl.getTestResult);

router.post('/diagnostic', authenticate, authorize('student'), [
  body('learning_path_id').isMongoId().withMessage('ID do plano inválido'),
], validate, diagnosticCtrl.generateTest);

router.post(
  '/diagnostic/:id/progress',
  authenticate, authorize('student'),
  progressCtrl.requestProgressTest
);

router.post(
  '/diagnostic/:id/diagnostic/submit',
  authenticate, authorize('student'), answersValidation, validate,
  (req, res, next) => diagnosticCtrl.submitAnswers(req, res, next, 'diagnostic')
);

router.post(
  '/diagnostic/:id/progress/submit',
  authenticate, authorize('student'), answersValidation, validate,
  (req, res, next) => diagnosticCtrl.submitAnswers(req, res, next, 'progress')
);

// ---- Planos de Ensino (trilhas de aprendizagem) ----

router.get('/my-enrollments', authenticate, authorize('student'), learningPathCtrl.getMyEnrollments);
router.get('/',               authenticate, learningPathCtrl.getAll);
router.get('/:id',            authenticate, learningPathCtrl.getById);

router.post('/', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Título obrigatório (máx. 200)'),
  body('topics').optional().isArray(),
], validate, learningPathCtrl.create);

router.put('/:id', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().isLength({ max: 200 }),
], validate, learningPathCtrl.update);

router.post('/:id/enroll', authenticate, authorize('student'), learningPathCtrl.enroll);

module.exports = router;
