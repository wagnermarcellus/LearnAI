const express = require('express');
const router = express.Router();

// Placeholder para rotas de Plano de Estudo
router.get('/', (req, res) => {
  res.json({ message: 'Get study plans' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create study plan' });
});

module.exports = router;
