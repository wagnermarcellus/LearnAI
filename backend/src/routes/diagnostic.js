const express = require('express');
const router = express.Router();

// Placeholder para rotas de Diagnóstico
router.get('/', (req, res) => {
  res.json({ message: 'Get diagnostic tests' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create diagnostic test' });
});

module.exports = router;
