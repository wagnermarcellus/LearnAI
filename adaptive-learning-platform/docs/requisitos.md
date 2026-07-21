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
| RNF08 | Desempenho | Pool de conexões com o banco de dados (máx. 20 conexões) |
| RNF09 | Manutenibilidade | Código organizado em camadas (controllers, services, routes, middlewares) |
| RNF10 | Manutenibilidade | Variáveis de ambiente separadas em arquivo `.env` |
| RNF11 | Portabilidade | Backend compatível com `DATABASE_URL` para deploy em nuvem |
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

## 4. Modelo Conceitual do Banco de Dados

```
USERS ──────────────── ENROLLMENTS ──────────── LEARNING_PATHS
  │ id (PK)                │ id (PK)                 │ id (PK)
  │ name                   │ user_id (FK)             │ title
  │ email                  │ learning_path_id (FK)    │ description
  │ password_hash          │ enrolled_at              │ created_by (FK→USERS)
  │ role                   └────────────────────      │ is_active
  │ xp                                                └───────────────────────
  │ level                                                          │
  │                                                                │
  ├──────────────────── DIAGNOSTIC_TESTS                    TOPICS │
  │                          │ id (PK)                      │ id (PK)
  │                          │ user_id (FK)                 │ learning_path_id (FK)
  │                          │ learning_path_id (FK)        │ title
  │                          │ type (diagnostic/progress)   │ order_index
  │                          │ status (pending/completed)   └──────────────────
  │                          │ score                                  │
  │                          │ level_assigned                         │
  │                          │ ai_raw_response                  SKILLS
  │                          └────────────────────              │ id (PK)
  │                                    │                        │ topic_id (FK)
  │                             QUESTIONS                       │ name
  │                                    │ id (PK)                └──────────────
  │                                    │ diagnostic_test_id (FK)
  │                                    │ topic_id (FK)
  │                                    │ question_text
  │                                    │ options (JSONB)
  │                                    │ correct_option
  │                                    │ difficulty
  │                                    └────────────────────
  │                                             │
  │                                    STUDENT_ANSWERS
  │                                             │ id (PK)
  │                                             │ diagnostic_test_id (FK)
  │                                             │ question_id (FK)
  │                                             │ user_id (FK)
  │                                             │ selected_option
  │                                             │ is_correct
  │                                             └────────────────────
  │
  ├──────────────────── STUDY_PLANS
  │                          │ id (PK)
  │                          │ user_id (FK)
  │                          │ learning_path_id (FK)
  │                          │ diagnostic_test_id (FK)
  │                          │ content (JSONB)
  │                          │ goals
  │                          └────────────────────
  │
  ├──────────────────── AI_INTERACTIONS
  │                          │ id (PK)
  │                          │ user_id (FK)
  │                          │ learning_path_id (FK)
  │                          │ role (user/assistant)
  │                          │ content
  │                          └────────────────────
  │
  ├──────────────────── USER_BADGES
  │                          │ id (PK)
  │                          │ user_id (FK)
  │                          │ badge
  │                          └────────────────────
  │
  └──────────────────── XP_EVENTS
                             │ id (PK)
                             │ user_id (FK)
                             │ xp_gained
                             │ reason
                             └────────────────────
```

---

## 5. Modelo Lógico do Banco de Dados

```sql
users(
  id UUID PK,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
)

learning_paths(
  id UUID PK,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID FK→users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
)

topics(
  id UUID PK,
  learning_path_id UUID FK→learning_paths(id) CASCADE,
  title VARCHAR(200) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
)

skills(
  id UUID PK,
  topic_id UUID FK→topics(id) CASCADE,
  name VARCHAR(200) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
)

enrollments(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  learning_path_id UUID FK→learning_paths(id) CASCADE,
  UNIQUE(user_id, learning_path_id)
)

diagnostic_tests(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  learning_path_id UUID FK→learning_paths(id) CASCADE,
  type ENUM('diagnostic','progress','final') NOT NULL DEFAULT 'diagnostic',
  status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  score NUMERIC(5,2),
  level_assigned ENUM('beginner','intermediate','advanced','expert'),
  ai_raw_response TEXT
)

questions(
  id UUID PK,
  diagnostic_test_id UUID FK→diagnostic_tests(id) CASCADE,
  topic_id UUID FK→topics(id),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option VARCHAR(1) NOT NULL,
  difficulty ENUM('beginner','intermediate','advanced','expert') NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
)

student_answers(
  id UUID PK,
  diagnostic_test_id UUID FK→diagnostic_tests(id) CASCADE,
  question_id UUID FK→questions(id) CASCADE,
  user_id UUID FK→users(id) CASCADE,
  selected_option VARCHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  UNIQUE(diagnostic_test_id, question_id, user_id)
)

study_plans(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  learning_path_id UUID FK→learning_paths(id) CASCADE,
  diagnostic_test_id UUID FK→diagnostic_tests(id),
  content JSONB NOT NULL,
  goals TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
)

ai_interactions(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  learning_path_id UUID FK→learning_paths(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL
)

user_badges(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  badge VARCHAR(50) NOT NULL,
  UNIQUE(user_id, badge)
)

xp_events(
  id UUID PK,
  user_id UUID FK→users(id) CASCADE,
  xp_gained INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL
)
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
[PostgreSQL]                      [Groq API (IA)]
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
