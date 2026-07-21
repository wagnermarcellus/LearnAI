const logger = require('../utils/logger');

const BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL    = process.env.GROQ_MODEL    || 'llama3-8b-8192';
const API_KEY  = process.env.GROQ_API_KEY  || '';

async function callAI(messages, { maxTokens = 1500, temperature = 0.7 } = {}) {
  const useMock = process.env.AI_MOCK === 'true' || !API_KEY;

  if (useMock) {
    logger.warn('AI_MOCK ativo — retornando resposta simulada');
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
    throw new Error(`API de IA retornou status ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
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
    { role: 'system', content: 'Gere avaliações de progresso adaptativas em JSON.' },
    {
      role: 'user',
      content: `5 questões de progresso para "${pathTitle}".\nNível: ${studentLevel}\nScore anterior: ${previousScore}%\nTópicos: ${topics.join(', ')}\nQuestões devem ser ${harder ? 'mais difíceis' : 'no mesmo nível'} que a avaliação anterior.\n\nMesmo formato JSON de questões diagnósticas.`,
    },
  ];

  const raw = await callAI(messages, { maxTokens: 2000, temperature: 0.4 });
  return parseJSON(raw);
}

function mockResponse(messages) {
  const last = messages[messages.length - 1].content || '';

  if (last.includes('questões')) {
    return JSON.stringify({
      questions: [
        {
          question_text: 'O que é uma Promise em JavaScript?',
          options: [
            { label: 'A', text: 'Um tipo primitivo de dado' },
            { label: 'B', text: 'Um objeto que representa a conclusão de uma operação assíncrona' },
            { label: 'C', text: 'Uma função que executa código síncrono' },
            { label: 'D', text: 'Um loop assíncrono nativo do JavaScript' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'Promises representam valores que podem estar disponíveis agora, no futuro ou nunca.',
          topic: 'JavaScript Assíncrono',
        },
        {
          question_text: 'Qual hook do React gerencia efeitos colaterais?',
          options: [
            { label: 'A', text: 'useState' },
            { label: 'B', text: 'useContext' },
            { label: 'C', text: 'useEffect' },
            { label: 'D', text: 'useReducer' },
          ],
          correct_option: 'C',
          difficulty: 'beginner',
          explanation: 'useEffect sincroniza o componente com sistemas externos, como APIs e timers.',
          topic: 'React Hooks',
        },
        {
          question_text: 'O que diferencia GET de POST no protocolo HTTP?',
          options: [
            { label: 'A', text: 'GET é mais rápido que POST em todos os casos' },
            { label: 'B', text: 'GET busca dados sem body; POST envia dados no body' },
            { label: 'C', text: 'POST não pode conter parâmetros na URL' },
            { label: 'D', text: 'Não há diferença prática entre eles' },
          ],
          correct_option: 'B',
          difficulty: 'beginner',
          explanation: 'GET recupera recursos com parâmetros na URL. POST envia dados no corpo da requisição.',
          topic: 'HTTP e REST',
        },
        {
          question_text: 'O que é JWT (JSON Web Token)?',
          options: [
            { label: 'A', text: 'Um banco de dados de sessões' },
            { label: 'B', text: 'Um padrão de criptografia de senhas' },
            { label: 'C', text: 'Um token compacto e assinado para autenticação stateless' },
            { label: 'D', text: 'Um protocolo de transferência de arquivos' },
          ],
          correct_option: 'C',
          difficulty: 'intermediate',
          explanation: 'JWT é um padrão (RFC 7519) para transmitir claims entre partes de forma compacta e segura.',
          topic: 'Autenticação',
        },
        {
          question_text: 'Em SQL, qual é a diferença entre INNER JOIN e LEFT JOIN?',
          options: [
            { label: 'A', text: 'INNER JOIN retorna todas as linhas da tabela esquerda' },
            { label: 'B', text: 'INNER JOIN retorna apenas os registros com correspondência nas duas tabelas; LEFT JOIN retorna todos da esquerda + matches da direita' },
            { label: 'C', text: 'São equivalentes em comportamento' },
            { label: 'D', text: 'LEFT JOIN é sempre mais rápido' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'INNER JOIN exige correspondência nas duas tabelas. LEFT JOIN mantém todos os registros da tabela esquerda.',
          topic: 'Banco de Dados SQL',
        },
        {
          question_text: 'Qual a finalidade do método bcrypt para senhas?',
          options: [
            { label: 'A', text: 'Criptografar a senha para que possa ser descriptografada depois' },
            { label: 'B', text: 'Gerar um hash com salt que dificulta ataques de força bruta' },
            { label: 'C', text: 'Comprimir a senha para economizar espaço no banco' },
            { label: 'D', text: 'Validar se a senha atende aos critérios de segurança' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'bcrypt aplica um salt aleatório e múltiplas rodadas de hashing, tornando ataques de dicionário inviáveis.',
          topic: 'Segurança',
        },
        {
          question_text: 'O que é CORS no contexto de APIs web?',
          options: [
            { label: 'A', text: 'Um protocolo de compressão de dados' },
            { label: 'B', text: 'Um mecanismo de segurança que controla quais origens podem acessar a API' },
            { label: 'C', text: 'Um formato de serialização de dados' },
            { label: 'D', text: 'Um banco de dados em memória' },
          ],
          correct_option: 'B',
          difficulty: 'intermediate',
          explanation: 'Cross-Origin Resource Sharing controla o acesso a recursos entre origens diferentes via headers HTTP.',
          topic: 'HTTP e REST',
        },
        {
          question_text: 'Qual é a principal vantagem de usar variáveis de ambiente (.env)?',
          options: [
            { label: 'A', text: 'Melhorar o desempenho do servidor' },
            { label: 'B', text: 'Separar configurações sensíveis do código-fonte versionado' },
            { label: 'C', text: 'Compactar o tamanho do bundle final' },
            { label: 'D', text: 'Reduzir o número de dependências do projeto' },
          ],
          correct_option: 'B',
          difficulty: 'beginner',
          explanation: 'Variáveis de ambiente isolam segredos (senhas, chaves de API) do repositório de código.',
          topic: 'Boas Práticas',
        },
        {
          question_text: 'O que é o padrão MVC no desenvolvimento de software?',
          options: [
            { label: 'A', text: 'Um protocolo de comunicação entre serviços' },
            { label: 'B', text: 'Um padrão de divisão da aplicação em Model, View e Controller' },
            { label: 'C', text: 'Uma forma de otimizar consultas ao banco de dados' },
            { label: 'D', text: 'Um tipo de banco de dados NoSQL' },
          ],
          correct_option: 'B',
          difficulty: 'beginner',
          explanation: 'MVC separa a lógica de dados (Model), apresentação (View) e controle de fluxo (Controller).',
          topic: 'Padrões de Projeto',
        },
        {
          question_text: 'O que significa "stateless" em uma API REST?',
          options: [
            { label: 'A', text: 'A API não possui banco de dados' },
            { label: 'B', text: 'Cada requisição contém todas as informações necessárias, sem sessão no servidor' },
            { label: 'C', text: 'A API só aceita requisições GET' },
            { label: 'D', text: 'O servidor não responde erros' },
          ],
          correct_option: 'B',
          difficulty: 'advanced',
          explanation: 'Em REST stateless, o servidor não armazena estado entre requisições. Cada chamada é autossuficiente.',
          topic: 'HTTP e REST',
        },
      ],
    });
  }

  if (last.includes('plano') || last.includes('Plano')) {
    return JSON.stringify({
      title: 'Plano Personalizado de Desenvolvimento Web',
      estimated_weeks: 12,
      weekly_hours: 10,
      phases: [
        {
          phase: 1,
          title: 'Fundamentos',
          duration_weeks: 4,
          topics: ['HTML5 Semântico', 'CSS3 Avançado', 'JavaScript ES6+'],
          objectives: ['Dominar estrutura HTML', 'Criar layouts responsivos', 'Programar com JS moderno'],
          resources: ['MDN Web Docs', 'JavaScript.info', 'CSS Tricks'],
        },
        {
          phase: 2,
          title: 'React e Ecossistema',
          duration_weeks: 4,
          topics: ['React Components', 'Hooks', 'React Router', 'Context API'],
          objectives: ['Construir SPAs com React', 'Gerenciar estado com hooks', 'Roteamento client-side'],
          resources: ['Documentação oficial React', 'Rocketseat Ignite'],
        },
        {
          phase: 3,
          title: 'Back-end e Integração',
          duration_weeks: 4,
          topics: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'JWT'],
          objectives: ['Criar APIs RESTful', 'Modelar banco de dados', 'Autenticação segura'],
          resources: ['Node.js Docs', 'PostgreSQL Tutorial', 'Express.js Guide'],
        },
      ],
      milestones: [
        { week: 4,  goal: 'Portfólio publicado com HTML/CSS/JS' },
        { week: 8,  goal: 'SPA em React conectada a uma API pública' },
        { week: 12, goal: 'Projeto fullstack com deploy em produção' },
      ],
      tips: [
        'Pratique todos os dias, mesmo que por 30 minutos',
        'Construa projetos reais desde o início',
        'Documente seu aprendizado no GitHub',
      ],
    });
  }

  if (last.includes('Analise') || last.includes('desempenho')) {
    return JSON.stringify({
      summary: 'O aluno demonstrou boa compreensão dos fundamentos. Há oportunidade de aprofundar conceitos de assincronicidade e banco de dados.',
      strengths: ['Bom entendimento de fundamentos de programação', 'Familiaridade com conceitos de HTTP'],
      weaknesses: ['JavaScript assíncrono (Promises, async/await)', 'Consultas SQL complexas'],
      recommendations: [
        'Dedicar 1 semana extra a exercícios de JavaScript assíncrono',
        'Praticar consultas SQL no SQLZoo ou HackerRank',
        'Construir um projeto integrando front-end e back-end',
      ],
      motivational_message: 'Ótimo começo! Com foco nos pontos identificados, você estará dominando o conteúdo em pouco tempo.',
    });
  }

  return 'Boa pergunta! Vou explicar de forma clara e objetiva. Este é um conceito importante que aparece bastante no desenvolvimento web. A melhor forma de entendê-lo é praticando com exemplos reais — tente criar um pequeno projeto que use esse conceito e você vai fixar muito mais rápido. Tem alguma dúvida específica sobre o tema?';
}

module.exports = {
  generateDiagnosticQuestions,
  analyzePedagogicalPerformance,
  generateStudyPlan,
  explainConcept,
  generateProgressTest,
};
