const express = require('express');
const router = express.Router();
const avaliacaoController = require('./avaliacaoDiagnosticaController');

// Rota POST para processar a requisição
router.post('/avaliar', avaliacaoController.gerarAvaliacao);

module.exports = router;
