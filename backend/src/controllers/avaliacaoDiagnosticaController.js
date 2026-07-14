const AvaliacaoDiagnostica = require('./AvaliacaoDiagnostica');
const { GoogleGenAI } = require('@google/genai');

// Inicialização do cliente oficial do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.gerarAvaliacao = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ erro: 'O campo "content" é obrigatório.' });
  }

  // PROMPT DE AVALIAÇÃO
  const prompt = `
    Analise o texto fornecido abaixo. Com base na qualidade, coerência e clareza, atribua uma nota de 0 a 10 e determine o nível de proficiência (Básico, Intermediário ou Avançado).
    
    Retorne a resposta EXCLUSIVAMENTE em formato JSON, exatamente com esta estrutura:
    {
      "nota": [numero],
      "nivel": "[string com o nível]",
      "feedback": "[string com uma breve justificativa]"
    }

    Texto: ${content}
  `;

  try {
    // Chamada de conteúdo com o modelo flash estável
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const respostaTexto = response.text.trim();
    
    // Limpeza de blocos de código markdown se houverem
    const jsonLimpo = respostaTexto.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultadoAvaliacao = JSON.parse(jsonLimpo);

    // Salvar no banco PostgreSQL usando o Sequelize
    const novaAvaliacao = await AvaliacaoDiagnostica.create({
      conteudo: content,
      nota: resultadoAvaliacao.nota,
      nivel: resultadoAvaliacao.nivel,
      feedback: resultadoAvaliacao.feedback
    });

    return res.status(200).json(novaAvaliacao);
  } catch (error) {
    console.error('Erro ao gerar avaliação:', error);
    return res.status(500).json({ erro: 'Erro interno ao processar e salvar a avaliação.' });
  }
};
