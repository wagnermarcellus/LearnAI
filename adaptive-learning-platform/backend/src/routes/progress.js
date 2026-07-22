const router = require('express').Router();
const ctrl   = require('../controllers/progressController');
const { authenticate } = require('../middlewares/auth');

router.get('/overview', authenticate, ctrl.getOverview);

module.exports = router;
