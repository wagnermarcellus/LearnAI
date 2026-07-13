const express = require('express');
const router = express.Router();

// Placeholder para rotas de Progresso
router.get('/', (req, res) => {
  res.json({ message: 'Get user progress' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Update user progress' });
});

module.exports = router;
