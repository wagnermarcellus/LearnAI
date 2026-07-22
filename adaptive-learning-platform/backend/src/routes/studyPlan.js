const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/studyPlanController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/', authenticate, ctrl.getMy);

router.post('/generate', authenticate, authorize('student'), [
  body('learning_path_id').isMongoId().withMessage('ID da trilha inválido'),
  body('goals').optional().isString().isLength({ max: 500 }),
], validate, ctrl.generate);

module.exports = router;
