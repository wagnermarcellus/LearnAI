# Análise de Requisitos — LearnAI

**Projeto:** Plataforma Web de Aprendizagem Adaptativa com IA  
**Curso:** Técnico em Desenvolvimento de Sistemas — SENAI/SC  
**Turma:** T DESI 2025/1 V1  

---

## 1. Requisitos Funcionais

| ID   | Descrição | Prioridade |
|------|-----------|------------|
| RF01 | O sistema deve permitir o cadastro de novos usuários com nome, e-mail e senha | Alta |
| RF02 | O sistema deve autenticar usuários via e-mail e senha, retornando um token JWT | Alta |
| RF03 | O sistema deve controlar o acesso por perfis: `student` e `admin` | Alta |
| RF04 | O admin deve poder criar trilhas de aprendizagem com título e descrição | Alta |
| RF05 | O admin deve poder adicionar tópicos e habilidades a cada trilha | Alta |
| RF06 | O aluno deve poder visualizar e buscar trilhas disponíveis | Alta |
| RF07 | O aluno deve poder se inscrever em trilhas | Alta |
| RF08 | O sistema deve gerar uma avaliação diagnóstica via IA ao aluno inscrito | Alta |
| RF09 | O aluno deve poder responder a avaliação diagnóstica | Alta |
| RF10 | O sistema deve calcular e registrar o score e o nível do aluno após a avaliação | Alta |
| RF11 | A IA deve analisar o desempenho e identificar pontos fortes e fracos | Alta |
| RF12 | O sistema deve gerar um plano de estudo personalizado com base no diagnóstico | Alta |
| RF13 | O aluno deve poder conversar com o tutor IA e obter explicações adaptadas ao seu nível | Alta |
| RF14 | O sistema deve registrar o histórico completo de mensagens com o tutor | Média |
| RF15 | O aluno deve poder solicitar avaliações de progresso com dificuldade adaptativa | Alta |
| RF16 | O sistema deve exibir o histórico de avaliações e evolução do aluno | Alta |
| RF17 | O sistema deve atribuir XP ao aluno proporcional ao desempenho em avaliações | Média |
| RF18 | O sistema deve calcular o nível do aluno com base no XP acumulado | Média |

---

## 2. Requisitos Não Funcionais

| ID    | Categoria | Descrição |
|-------|-----------|-----------|
| RNF01 | Segurança | Senhas armazenadas com hash bcrypt (salt rounds ≥ 12) |
| RNF02 | Segurança | Rotas protegidas por JWT com expiração configurável |
| RNF03 | Segurança | Controle de acesso baseado em papel (RBAC) |
| RNF04 | Segurança | Rate limiting de 100 requisições por 15 minutos por IP |
| RNF05 | Segurança | Headers de segurança via Helmet.js |
| RNF06 | Usabilidade | Interface responsiva compatível com dispositivos móveis e desktop |
| RNF07 | Usabilidade | Feedback visual em todas as ações assíncronas (loading states) |
| RNF08 | Desempenho | Conexão única com o MongoDB gerenciada pelo Mongoose (connection pooling nativo do driver) |
| RNF09 | Manutenibilidade | Código organizado em camadas (controllers, services, routes, middlewares, models) |
| RNF10 | Manutenibilidade | Variáveis de ambiente separadas em arquivo `.env` |
| RNF11 | Portabilidade | Backend compatível com `MONGODB_URI` para deploy em nuvem (ex.: MongoDB Atlas) |
| RNF12 | Disponibilidade | Health check endpoint em `/api/health` |

---

## 3. Casos de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│                        LearnAI System                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    <<include>>                            │  │
│  │                                                           │  │
│  │  [Cadastrar-se] ─────────────────────────────────────►   │  │
│  │  [Fazer Login]  ──► <<autenticar>> ──────────────────►   │  │
│  │                                                           │  │
│  │  ALUNO:                                                   │  │
│  │  [Visualizar Trilhas]                                     │  │
│  │  [Inscrever-se em Trilha]                                 │  │
│  │  [Realizar Avaliação Diagnóstica] ──► <<gerar via IA>>    │  │
│  │  [Visualizar Resultado + Análise Pedagógica]              │  │
│  │  [Gerar Plano de Estudo] ──────────► <<gerar via IA>>    │  │
│  │  [Conversar com Tutor IA] ─────────► <<chat via IA>>     │  │
│  │  [Solicitar Avaliação de Progresso]                       │  │
│  │  [Visualizar Histórico de Evolução]                       │  │
│  │                                                           │  │
│  │  ADMIN:                                                   │  │
│  │  [Criar Trilha de Aprendizagem]                           │  │
│  │  [Gerenciar Tópicos e Habilidades]                        │  │
│  │  [Visualizar Trilhas]                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Atores: <<Aluno>>, <<Admin>>, <<IA (Groq API)>>                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Modelo Conceitual do Banco de Dados (MongoDB)

Coleções, com `topics`/`skills` e `questions`/`answers` embutidos como subdocumentos
nos documentos pai (evita joins para os dados sempre lidos em conjunto). Relações entre
coleções (usuário ⇄ trilha ⇄ inscrição ⇄ avaliação ⇄ plano) usam `ObjectId` como referência.

```
USERS                          ENROLLMENTS                    LEARNING_PATHS
  _id                            _id                            _id
  name                           user_id      (ref→USERS)        title
  email                          learning_path_id (ref→LP)       description
  password_hash                 enrolled_at                     created_by (ref→USERS)
  role                           completed_at                    is_active
  xp                                                              topics: [{
  level                                                             _id, title, description,
  is_active                                                        order_index,
                                                                     skills: [{ _id, name,
  ┌──────────────────── DIAGNOSTIC_TESTS                                       description, order_index }]
  │                       _id                                                }]
  │                       user_id       (ref→USERS)
  │                       learning_path_id (ref→LP)
  │                       type (diagnostic/progress)
  │                       status (pending/completed)
  │                       score
  │                       level_assigned
  │                       ai_raw_response
  │                       questions: [{ _id, topic_title, question_text,
  │                                     options, correct_option, difficulty,
  │                                     explanation, order_index }]
  │                       answers:   [{ _id, question_id, user_id,
  │                                     selected_option, is_correct, answered_at }]
  │
  ├──────────────────── STUDY_PLANS
  │                       _id
  │                       user_id            (ref→USERS)
  │                       learning_path_id   (ref→LP)
  │                       diagnostic_test_id (ref→DIAGNOSTIC_TESTS)
  │                       content
  │                       goals
  │                       is_active
  │
  ├──────────────────── AI_INTERACTIONS
  │                       _id
  │                       user_id          (ref→USERS)
  │                       learning_path_id (ref→LP)
  │                       topic_title
  │                       role (user/assistant)
  │                       content
  │                       tokens_used
  │
  ├──────────────────── USER_BADGES
  │                       _id
  │                       user_id (ref→USERS)
  │                       badge
  │
  └──────────────────── XP_EVENTS
                          _id
                          user_id (ref→USERS)
                          xp_gained
                          reason
```

---

## 5. Modelo Lógico do Banco de Dados (Mongoose)

```js
User {
  name: String,
  email: String (unique),
  password_hash: String,
  role: 'student' | 'admin',
  xp: Number,
  level: Number,
  is_active: Boolean,
}

LearningPath {
  title: String,
  description: String,
  created_by: ObjectId → User,
  is_active: Boolean,
  topics: [{
    title: String,
    description: String,
    order_index: Number,
    skills: [{ name: String, description: String, order_index: Number }],
  }],
}

Enrollment {
  user_id: ObjectId → User,
  learning_path_id: ObjectId → LearningPath,
  enrolled_at: Date,
  completed_at: Date,
  // índice único composto: (user_id, learning_path_id)
}

DiagnosticTest {
  user_id: ObjectId → User,
  learning_path_id: ObjectId → LearningPath,
  type: 'diagnostic' | 'progress' | 'final',
  status: 'pending' | 'completed',
  score: Number,
  level_assigned: 'beginner' | 'intermediate' | 'advanced' | 'expert',
  ai_raw_response: Mixed,
  questions: [{
    topic_title: String,
    question_text: String,
    options: Mixed,
    correct_option: String,
    difficulty: String,
    explanation: String,
    order_index: Number,
  }],
  answers: [{
    question_id: ObjectId,       // referencia o _id de um item em `questions`
    user_id: ObjectId → User,
    selected_option: String,
    is_correct: Boolean,
    answered_at: Date,
  }],
}

StudyPlan {
  user_id: ObjectId → User,
  learning_path_id: ObjectId → LearningPath,
  diagnostic_test_id: ObjectId → DiagnosticTest,
  content: Mixed,
  goals: String,
  is_active: Boolean,
}

AiInteraction {
  user_id: ObjectId → User,
  learning_path_id: ObjectId → LearningPath,
  topic_title: String,
  role: String,
  content: String,
  tokens_used: Number,
}

UserBadge {
  user_id: ObjectId → User,
  badge: String,
  // índice único composto: (user_id, badge)
}

XpEvent {
  user_id: ObjectId → User,
  xp_gained: Number,
  reason: String,
}
```

---

## 6. Arquitetura Geral do Sistema

```
[Navegador / React SPA]
        │
        │ HTTP REST (JSON)
        │ Header: Authorization: Bearer <JWT>
        ▼
[Express.js API — Node.js]
        │
   ┌────┴────────────────────────────────┐
   │                                     │
   ▼                                     ▼
[MongoDB]                         [Groq API (IA)]
  Dados persistentes            Geração de questões,
  Usuários, trilhas,            análise pedagógica,
  avaliações, planos            plano de estudo,
                                tutor interativo
```

**Camadas do backend:**
- **Routes** — define os endpoints e aplica os middlewares de validação
- **Middlewares** — autenticação JWT, autorização RBAC, validação de input, tratamento de erros
- **Controllers** — orquestra a lógica de cada requisição
- **Services** — encapsula regras de negócio e chamadas externas (IA)
- **Config** — gerencia a conexão com o banco de dados
- **Utils** — helpers reutilizáveis (logger, respostas padronizadas)
