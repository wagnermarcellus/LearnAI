const router = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/learningPathController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/',                 authenticate, ctrl.getAll);
router.get('/my-enrollments',   authenticate, authorize('student'), ctrl.getMyEnrollments);
router.get('/:id',              authenticate, ctrl.getById);

router.post('/', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Título obrigatório (max 200)'),
  body('topics').optional().isArray(),
], validate, ctrl.create);

router.put('/:id', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().isLength({ max: 200 }),
], validate, ctrl.update);

router.post('/:id/enroll', authenticate, authorize('student'), ctrl.enroll);

module.exports = router;
