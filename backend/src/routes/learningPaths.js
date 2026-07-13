const express = require('express');
const router = express.Router();

// Placeholder para rotas de Learning Paths
router.get('/', (req, res) => {
  res.json({ message: 'Get learning paths' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create learning path' });
});

module.exports = router;
