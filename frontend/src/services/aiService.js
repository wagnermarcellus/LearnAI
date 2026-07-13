/**
 * AI Service — Integração com Groq API (protocolo OpenAI-compatible)
 *
 * Para trocar de provedor, basta alterar GROQ_BASE_URL e GROQ_MODEL no .env.
 * Compatível com: Groq, OpenAI, Together AI, Ollama (local), etc.
 */
const logger = require('../utils/logger');

const BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL    = process.env.GROQ_MODEL    || 'llama3-8b-8192';
const API_KEY  = process.env.GROQ_API_KEY  || '';

// ── Chamada base à API ────────────────────────────────────────────────────────
async function callAI(messages, { maxTokens = 1500, temperature = 0.7 } = {}) {
  const useMock = process.env.AI_MOCK === 'true' || !API_KEY;

  if (useMock) {
    logger.warn('AI_MOCK ativado — retornando resposta simulada');
    return mockResponse(messages);
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
    throw new Error(`IA retornou status ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Helpers para parsear JSON da IA com segurança ─────────────────────────────
function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── 1. Geração de questões diagnósticas ──────────────────────────────────────
async function generateDiagnosticQuestions({ pathTitle, topics, numQuestions = 10 }) {
  const topicList = topics.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n');

  const messages = [
    {
      role: 'system',
      content: `Você é um especialista pedagógico. Gere avaliações diagnósticas técnicas.
Responda APENAS com JSON válido, sem texto adicional, sem markdown.`,
    },
    {
      role: 'user',
      content: `Gere ${numQuestions} questões de múltipla escolha para avaliar o nível do aluno na trilha "${pathTitle}".

Tópicos:
${topicList}

Distribua por dificuldade: beginner (30%), intermediate (40%), advanced (20%), expert (10%).

Formato obrigatório (JSON puro):
{
  "questions": [
    {
      "question_text": "string",
      "options": [
        {"label":"A","text":"..."},
        {"label":"B","text":"..."},
        {"label":"C","text":"..."},
        {"label":"D","text":"..."}
      ],
      "correct_option": "A",
      "difficulty": "beginner",
      "explanation": "string",
      "topic": "nome do tópico"
    }
  ]
}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 3000, temperature: 0.4 });
  return parseJSON(raw);
}

// ── 2. Análise pedagógica pós-avaliação ──────────────────────────────────────
async function analyzePedagogicalPerformance({ studentName, pathTitle, score, level, topicScores }) {
  const summary = topicScores.map(t => `- ${t.topic}: ${t.correct}/${t.total} acertos`).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'Você é um tutor pedagógico especializado. Analise o desempenho e gere feedback construtivo em JSON.',
    },
    {
      role: 'user',
      content: `Analise o desempenho do aluno "${studentName}" na trilha "${pathTitle}".

Score: ${score}% — Nível classificado: ${level}

Por tópico:
${summary}

Responda em JSON puro:
{
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "motivational_message": "string"
}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 1000, temperature: 0.6 });
  return parseJSON(raw);
}

// ── 3. Geração de plano de estudo personalizado ───────────────────────────────
async function generateStudyPlan({ studentName, pathTitle, level, weaknesses, goals, topics }) {
  const messages = [
    {
      role: 'system',
      content: 'Você é especialista em educação adaptativa. Crie planos de estudo personalizados em JSON.',
    },
    {
      role: 'user',
      content: `Crie um plano de estudo para "${studentName}".

Trilha: ${pathTitle}
Nível atual: ${level}
Tópicos disponíveis: ${topics.map(t => t.title).join(', ')}
Pontos fracos: ${weaknesses.join(', ') || 'nenhum identificado'}
Objetivos: ${goals || 'dominar todos os tópicos'}

Responda em JSON puro:
{
  "title": "string",
  "estimated_weeks": number,
  "weekly_hours": number,
  "phases": [
    {
      "phase": number,
      "title": "string",
      "duration_weeks": number,
      "topics": ["string"],
      "objectives": ["string"],
      "resources": ["string"]
    }
  ],
  "milestones": [{"week": number, "goal": "string"}],
  "tips": ["string"]
}`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 2000, temperature: 0.5 });
  return parseJSON(raw);
}

// ── 4. Tutor interativo (chat) ────────────────────────────────────────────────
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
      content: `Você é um tutor especializado em tecnologia e programação.
Nível do aluno: ${studentLevel}. ${levelGuide[studentLevel] || levelGuide.beginner}
Seja claro, didático e encorajador. Responda em português.${context ? `\nContexto da trilha: ${context}` : ''}`,
    },
    ...chatHistory.slice(-10), // últimas 10 mensagens como contexto
    { role: 'user', content: concept },
  ];

  return callAI(messages, { maxTokens: 800, temperature: 0.7 });
}

// ── 5. Geração de avaliação de progresso ─────────────────────────────────────
async function generateProgressTest({ pathTitle, topics, studentLevel, previousScore }) {
  const harder = previousScore >= 70;

  const messages = [
    {
      role: 'system',
      content: 'Gere avaliações de progresso adaptativas em JSON.',
    },
    {
      role: 'user',
      content: `Gere 5 questões de progresso para a trilha "${pathTitle}".
Nível atual: ${studentLevel}
Score anterior: ${previousScore}%
Tópicos: ${topics.join(', ')}
As questões devem ser ${harder ? 'mais difíceis que o teste anterior' : 'no mesmo nível do teste anterior'}.

Mesmo formato JSON do teste diagnóstico (campo "questions").`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 2000, temperature: 0.4 });
  return parseJSON(raw);
}

// ── Mock local (sem chave da API) ─────────────────────────────────────────────
function mockResponse(messages) {
  const last = messages[messages.length - 1].content || '';

  if (last.includes('questões') || last.includes('questões de progresso')) {
    return JSON.stringify({
      questions: [
        {
          question_text: 'O que é uma Promise em JavaScript?',
          options: [
            { label: 'A', text: 'Um tipo primitivo de dado' },
            { label: 'B', text: 'Um objeto que representa a conclusão (ou falha) de uma operação assíncrona' },
            { label: 'C', text: 'Uma função que executa código síncrono' },
            { label: 'D', text: 'Um loop assíncrono nativo do JavaScript' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'Promises representam valores que podem estar disponíveis agora, no futuro ou nunca, permitindo lidar com operações assíncronas de forma elegante.',
          topic: 'JavaScript Assíncrono',
        },
        {
          question_text: 'Qual hook do React é usado para gerenciar efeitos colaterais?',
          options: [
            { label: 'A', text: 'useState' },
            { label: 'B', text: 'useContext' },
            { label: 'C', text: 'useEffect' },
            { label: 'D', text: 'useReducer' },
          ],
          correct_option: 'C',
          difficulty: 'beginner',
          explanation: 'useEffect permite sincronizar um componente com sistemas externos, como APIs, timers ou DOM manual.',
          topic: 'React Hooks',
        },
        {
          question_text: 'O que diferencia GET de POST no protocolo HTTP?',
          options: [
            { label: 'A', text: 'GET é mais rápido que POST' },
            { label: 'B', text: 'GET é usado para buscar dados sem body; POST envia dados no body da requisição' },
            { label: 'C', text: 'POST não pode ter parâmetros na URL' },
            { label: 'D', text: 'Não há diferença prática entre eles' },
          ],
          correct_option: 'B',
          difficulty: 'beginner',
          explanation: 'GET recupera recursos e os parâmetros vão na URL. POST cria/envia dados no body.',
          topic: 'HTTP e REST',
        },
        {
          question_text: 'O que é JWT (JSON Web Token)?',
          options: [
            { label: 'A', text: 'Um banco de dados de sessões' },
            { label: 'B', text: 'Um padrão de criptografia de senhas' },
            { label: 'C', text: 'Um token compacto e assinado digitalmente usado para autenticação stateless' },
            { label: 'D', text: 'Um protocolo de transferência de arquivos' },
          ],
          correct_option: 'C',
          difficulty: 'intermediate',
          explanation: 'JWT é um padrão (RFC 7519) que define tokens compactos e seguros para transmitir claims entre partes.',
          topic: 'Autenticação',
        },
        {
          question_text: 'Em SQL, qual é a diferença entre INNER JOIN e LEFT JOIN?',
          options: [
            { label: 'A', text: 'INNER JOIN retorna todas as linhas da tabela esquerda; LEFT JOIN retorna apenas os matches' },
            { label: 'B', text: 'INNER JOIN retorna apenas os registros com correspondência nas duas tabelas; LEFT JOIN retorna todos da esquerda + matches da direita' },
            { label: 'C', text: 'São idênticos' },
            { label: 'D', text: 'LEFT JOIN é mais rápido em todos os casos' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'INNER JOIN retorna apenas linhas com correspondência nas duas tabelas. LEFT JOIN retorna todas as da esquerda, preenchendo com NULL onde não há match na direita.',
          topic: 'Banco de Dados SQL',
        },
      ],
    });
  }

  if (last.includes('plano de estudo')) {
    return JSON.stringify({
      title: 'Plano Personalizado de Desenvolvimento Web',
      estimated_weeks: 12,
      weekly_hours: 10,
      phases: [
        {
          phase: 1,
          title: 'Fundamentos Sólidos',
          duration_weeks: 4,
          topics: ['HTML5 Semântico', 'CSS3 Avançado', 'JavaScript ES6+'],
          objectives: ['Dominar estrutura e semântica HTML', 'Criar layouts responsivos com Flexbox/Grid', 'Programar com JS moderno (async/await, destructuring)'],
          resources: ['MDN Web Docs', 'JavaScript.info', 'CSS Tricks'],
        },
        {
          phase: 2,
          title: 'React e Ecossistema Front-end',
          duration_weeks: 4,
          topics: ['React Components', 'Hooks', 'React Router', 'Context API'],
          objectives: ['Construir SPAs com React', 'Gerenciar estado com hooks', 'Implementar roteamento client-side'],
          resources: ['Documentação oficial React', 'Rocketseat - Ignite React'],
        },
        {
          phase: 3,
          title: 'Back-end e Integração',
          duration_weeks: 4,
          topics: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'JWT'],
          objectives: ['Criar APIs RESTful com Express', 'Modelar e integrar banco de dados', 'Implementar autenticação segura'],
          resources: ['Node.js Docs', 'PostgreSQL Tutorial', 'Express.js Guide'],
        },
      ],
      milestones: [
        { week: 4,  goal: 'Portfólio pessoal publicado com HTML/CSS/JS' },
        { week: 8,  goal: 'SPA em React conectada a uma API pública' },
        { week: 12, goal: 'Projeto fullstack com deploy em produção' },
      ],
      tips: [
        'Pratique todos os dias, mesmo que por 30 minutos',
        'Construa projetos reais desde o início',
        'Documente seu aprendizado no GitHub',
        'Participe de comunidades (Discord, fóruns)',
      ],
    });
  }

  if (last.includes('Analise o desempenho')) {
    return JSON.stringify({
      summary: 'O aluno demonstrou boa compreensão dos conceitos fundamentais, com destaque em estrutura de dados. Há oportunidade de aprofundar conhecimentos em assincronicidade e banco de dados.',
      strengths: ['Bom entendimento de fundamentos de programação', 'Familiaridade com estrutura HTML/CSS'],
      weaknesses: ['JavaScript assíncrono (Promises, async/await)', 'Consultas SQL complexas'],
      recommendations: [
        'Dedique 1 semana extra a exercícios de JavaScript assíncrono',
        'Pratique consultas SQL com desafios no SQLZoo ou HackerRank',
        'Construa um projeto pequeno integrando front-end e back-end',
      ],
      motivational_message: 'Ótimo começo! Você tem uma base sólida para construir. Com foco nos pontos identificados, você estará dominando o conteúdo em pouco tempo. 🚀',
    });
  }

  // Chat padrão do tutor
  return `Ótima pergunta! Vou explicar de forma clara e objetiva.

Este é um conceito importante no desenvolvimento web. A melhor forma de entendê-lo é praticando com exemplos reais.

Aqui estão os pontos principais que você precisa dominar:
1. Entenda o conceito teórico por trás
2. Veja exemplos de código funcionando
3. Modifique e experimente por conta própria
4. Construa algo com esse conhecimento

Continue praticando! Cada linha de código que você escreve te aproxima dos seus objetivos. 💪

Tem alguma dúvida específica sobre esse tema?`;
}

module.exports = {
  generateDiagnosticQuestions,
  analyzePedagogicalPerformance,
  generateStudyPlan,
  explainConcept,
  generateProgressTest,
};
