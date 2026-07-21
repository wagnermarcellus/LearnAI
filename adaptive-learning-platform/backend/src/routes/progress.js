const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/progressController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/overview', authenticate, ctrl.getOverview);

router.post('/test', authenticate, authorize('student'), [
  body('learning_path_id').isUUID().withMessage('ID da trilha inválido'),
], validate, ctrl.requestProgressTest);

module.exports = router;
