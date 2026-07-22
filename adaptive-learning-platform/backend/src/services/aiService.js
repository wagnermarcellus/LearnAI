const logger = require('../utils/logger');

const BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL    = process.env.GROQ_MODEL    || 'llama-3.1-8b-instant';
const API_KEY  = process.env.GROQ_API_KEY  || '';

async function callAI(messages, { maxTokens = 1500, temperature = 0.7 } = {}) {
  if (!API_KEY) {
    throw new Error('GROQ_API_KEY não configurada');
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error('Erro na API de IA', { status: res.status, body });
    throw new Error(`API de IA retornou status ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Resposta da IA não contém um JSON válido');
  }
  return JSON.parse(clean.slice(start, end + 1));
}

async function generateDiagnosticQuestions({ pathTitle, topics, numQuestions = 10 }) {
  const topicList = topics.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'Você é um especialista pedagógico. Responda APENAS com JSON válido, sem texto adicional.',
    },
    {
      role: 'user',
      content: `Gere ${numQuestions} questões de múltipla escolha para a trilha "${pathTitle}".\n\nTópicos:\n${topicList}\n\nDistribua: beginner (30%), intermediate (40%), advanced (20%), expert (10%).\n\nFormato JSON:\n{\n  "questions": [\n    {\n      "question_text": "string",\n      "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],\n      "correct_option": "A",\n      "difficulty": "beginner",\n      "explanation": "string",\n      "topic": "nome do tópico"\n    }\n  ]\n}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 3000, temperature: 0.4 });
  return parseJSON(raw);
}

async function analyzePedagogicalPerformance({ studentName, pathTitle, score, level, topicScores }) {
  const summary = topicScores.map(t => `- ${t.topic}: ${t.correct}/${t.total} acertos`).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'Você é um tutor pedagógico. Analise o desempenho e gere feedback em JSON.',
    },
    {
      role: 'user',
      content: `Analise o desempenho de "${studentName}" na trilha "${pathTitle}".\n\nScore: ${score}% — Nível: ${level}\n\nPor tópico:\n${summary}\n\nJSON:\n{\n  "summary": "string",\n  "strengths": ["string"],\n  "weaknesses": ["string"],\n  "recommendations": ["string"],\n  "motivational_message": "string"\n}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 1000, temperature: 0.6 });
  return parseJSON(raw);
}

async function generateStudyPlan({ studentName, pathTitle, level, weaknesses, goals, topics }) {
  const messages = [
    {
      role: 'system',
      content: 'Você é especialista em educação adaptativa. Crie planos de estudo em JSON.',
    },
    {
      role: 'user',
      content: `Plano para "${studentName}".\n\nTrilha: ${pathTitle}\nNível: ${level}\nTópicos: ${topics.map(t => t.title).join(', ')}\nPontos fracos: ${weaknesses.join(', ') || 'nenhum'}\nObjetivos: ${goals || 'dominar todos os tópicos'}\n\nJSON:\n{\n  "title": "string",\n  "estimated_weeks": number,\n  "weekly_hours": number,\n  "phases": [{"phase": number,"title": "string","duration_weeks": number,"topics": ["string"],"objectives": ["string"],"resources": ["string"]}],\n  "milestones": [{"week": number,"goal": "string"}],\n  "tips": ["string"]\n}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 2000, temperature: 0.5 });
  return parseJSON(raw);
}

async function explainConcept({ concept, studentLevel, context, chatHistory = [] }) {
  const levelGuide = {
    beginner:     'Use linguagem simples, analogias do cotidiano e exemplos básicos.',
    intermediate: 'Use terminologia técnica com exemplos práticos de código.',
    advanced:     'Explore padrões de projeto, boas práticas e casos de uso reais.',
    expert:       'Discuta trade-offs, otimizações e arquiteturas de alto nível.',
  };

  const messages = [
    {
      role: 'system',
      content: `Você é um tutor de programação. Nível do aluno: ${studentLevel}. ${levelGuide[studentLevel] || levelGuide.beginner} Responda em português.${context ? `\nContexto da trilha: ${context}` : ''}`,
    },
    ...chatHistory.slice(-10),
    { role: 'user', content: concept },
  ];

  return callAI(messages, { maxTokens: 800, temperature: 0.7 });
}

async function generateProgressTest({ pathTitle, topics, studentLevel, previousScore }) {
  const harder = previousScore >= 70;

  const messages = [
    {
      role: 'system',
      content: 'Você é um especialista pedagógico. Responda APENAS com JSON válido, sem texto adicional.',
    },
    {
      role: 'user',
      content: `Gere 5 questões de múltipla escolha de progresso para a trilha "${pathTitle}".\n\nNível do aluno: ${studentLevel}\nScore anterior: ${previousScore}%\nTópicos: ${topics.join(', ')}\nAs questões devem ser ${harder ? 'mais difíceis' : 'do mesmo nível'} que a avaliação anterior.\n\nFormato JSON:\n{\n  "questions": [\n    {\n      "question_text": "string",\n      "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],\n      "correct_option": "A",\n      "difficulty": "beginner",\n      "explanation": "string",\n      "topic": "nome do tópico"\n    }\n  ]\n}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 2000, temperature: 0.4 });
  return parseJSON(raw);
}

module.exports = {
  generateDiagnosticQuestions,
  analyzePedagogicalPerformance,
  generateStudyPlan,
  explainConcept,
  generateProgressTest,
};
