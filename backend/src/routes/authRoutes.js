const express = require('express');
const { authenticate, authorize } = require('./authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

// Rotas públicas (sem autenticação)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authenticate, authController.me);

module.exports = router;
