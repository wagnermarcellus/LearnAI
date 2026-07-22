# LearnAI — Plataforma de Aprendizagem Adaptativa com IA

**Situação de Aprendizagem — SENAI/SC**  
**Curso:** Técnico em Desenvolvimento de Sistemas  
**UC:** Desenvolvimento de Sistemas · CH: 25h  
**Turma:** T DESI 2025/1 V1  

---

## Estrutura do Repositório

```
adaptive-learning-platform/
├── database/
│   └── seed.js
├── docs/
│   ├── requisitos.md        ← Análise de requisitos + casos de uso + modelo de dados
│   ├── api.md               ← Documentação completa da API REST
│   └── testes.md            ← Plano de testes funcionais e de integração
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/
│       │   └── database.js
│       ├── models/
│       │   ├── User.js
│       │   ├── LearningPath.js
│       │   ├── Enrollment.js
│       │   ├── DiagnosticTest.js
│       │   ├── StudyPlan.js
│       │   ├── AiInteraction.js
│       │   ├── UserBadge.js
│       │   └── XpEvent.js
│       ├── middlewares/
│       │   ├── auth.js
│       │   ├── validate.js
│       │   └── errorHandler.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── learningPathController.js
│       │   ├── diagnosticController.js
│       │   ├── studyPlanController.js
│       │   ├── aiTutorController.js
│       │   └── progressController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── learningPaths.js
│       │   ├── diagnostic.js
│       │   ├── studyPlan.js
│       │   ├── aiTutor.js
│       │   └── progress.js
│       ├── services/
│       │   └── aiService.js
│       └── utils/
│           ├── logger.js
│           └── response.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── styles/
        │   └── global.css
        ├── components/
        │   └── common/
        │       ├── Layout.jsx
        │       └── ProtectedRoute.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── LearningPathsPage.jsx
            ├── LearningPathDetailPage.jsx
            ├── DiagnosticTestPage.jsx
            ├── DiagnosticResultPage.jsx
            ├── StudyPlanPage.jsx
            ├── AITutorPage.jsx
            ├── ProgressPage.jsx
            └── AdminPathsPage.jsx
```

---

## Tecnologias Utilizadas

| Camada | Tecnologias |
|--------|-------------|
| Front-end | React 18, React Router 6, Axios, Vite |
| Back-end | Node.js, Express.js, JWT, bcryptjs, Helmet, express-validator |
| Banco de dados | MongoDB 6+ (Mongoose) — local ou MongoDB Atlas |
| IA | Qualquer API compatível com OpenAI Chat Completions (Groq, Gemini, etc.) |
| Versionamento | Git |

---

## Instalação e Configuração

### Pré-requisitos

- Node.js v18 ou superior
- MongoDB 6 ou superior (local, Docker ou um cluster no MongoDB Atlas)
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/adaptive-learning-platform.git
cd adaptive-learning-platform
```

### 2. Banco de dados

Use uma instância local do MongoDB ou crie um cluster gratuito no
[MongoDB Atlas](https://cloud.mongodb.com). Não é preciso criar coleções manualmente — os
schemas do Mongoose (`backend/src/models/`) as criam automaticamente na primeira gravação.

Depois de configurar o `.env` (próximo passo), rode o seed para criar o usuário admin padrão:

```bash
cd backend
node ../database/seed.js
```

### 3. Back-end

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/adaptive_learning
JWT_SECRET=string_longa_e_aleatoria
GROQ_API_KEY=sua_chave_groq
```

Para usar o MongoDB Atlas, troque `MONGODB_URI` pela connection string do cluster
(Atlas → Connect → Drivers → Node.js), incluindo usuário, senha e nome do banco:

```env
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/adaptive_learning?retryWrites=true&w=majority
```

```bash
npm install
npm run dev
```

Verifique: `curl http://localhost:3001/api/health`

### 4. Front-end

```bash
cd ../frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

### 5. Credenciais padrão

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@platform.com | Admin@123 |

---

## Integração com IA

O serviço de IA (`backend/src/services/aiService.js`) fala com qualquer endpoint compatível com a
API de Chat Completions da OpenAI, então é possível usar **Groq**, **Gemini** ou outro provedor
equivalente apenas trocando as variáveis de ambiente — o código não muda.

### Opção A — Groq (padrão do `.env.example`)

1. Crie uma conta em https://console.groq.com
2. Gere uma API Key gratuita
3. No `.env` do backend:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### Opção B — Gemini (via endpoint compatível com OpenAI)

1. Gere uma API Key em https://aistudio.google.com/apikey
2. No `.env` do backend:

```env
GROQ_API_KEY=sua_chave_gemini
GROQ_MODEL=gemini-2.0-flash
GROQ_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

As variáveis mantêm o prefixo `GROQ_` por serem os nomes lidos pelo `aiService.js`, independente do
provedor escolhido.

4. Reinicie o servidor após qualquer mudança no `.env`

`GROQ_API_KEY` é obrigatória — sem ela, qualquer chamada à IA (tutor, avaliações, planos de estudo)
retorna erro em vez de uma resposta simulada.

---

## Arquitetura do Sistema

```
[React SPA]  ──HTTP/REST──►  [Express API]  ──►  [MongoDB]
                                   │
                                   └──►  [Groq API]
```

O back-end segue arquitetura em camadas:

- **Routes** — define os endpoints e aplica middlewares de validação
- **Middlewares** — autenticação JWT, autorização RBAC, validação de input, tratamento de erros
- **Controllers** — orquestra a lógica de cada requisição
- **Services** — encapsula a integração com a IA (Groq)
- **Models** — schemas Mongoose (User, LearningPath, DiagnosticTest, StudyPlan, etc.)
- **Config** — conexão com o MongoDB via Mongoose
- **Utils** — logger (Winston) e helpers de resposta padronizada

---

## Segurança

- Senhas com hash bcrypt (salt rounds 12)
- Autenticação via JWT com expiração configurável
- Controle de acesso por perfil — RBAC (student / admin)
- Rate limiting — 100 requisições por 15 minutos por IP
- Headers de segurança — Helmet.js
- Validação de input — express-validator em todas as rotas
- CORS configurado por origem

---

## Documentação Técnica

- `docs/requisitos.md` — Análise de requisitos, casos de uso e modelo de dados
- `docs/api.md` — Documentação completa de todos os endpoints
- `docs/testes.md` — Plano de testes funcionais e de integração
