const express = require('express');
const router = express.Router();

// Placeholder para rotas de IA Tutor
router.get('/', (req, res) => {
  res.json({ message: 'Get AI tutor sessions' });
});

router.post('/chat', (req, res) => {
  res.json({ message: 'Send message to AI tutor' });
});

module.exports = router;
