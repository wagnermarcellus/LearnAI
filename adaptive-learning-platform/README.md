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
│   └── schema.sql
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
| Banco de dados | PostgreSQL 14+ |
| IA | Qualquer API compatível com OpenAI Chat Completions (Groq, Gemini, etc.) — modo mock disponível |
| Versionamento | Git |

---

## Instalação e Configuração

### Pré-requisitos

- Node.js v18 ou superior
- PostgreSQL 14 ou superior
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/adaptive-learning-platform.git
cd adaptive-learning-platform
```

### 2. Banco de dados

```bash
psql -U postgres -c "CREATE DATABASE adaptive_learning;"
psql -U postgres -d adaptive_learning -f database/schema.sql
```

### 3. Back-end

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adaptive_learning
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=string_longa_e_aleatoria
AI_MOCK=true
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
GROQ_MODEL=llama3-8b-8192
GROQ_BASE_URL=https://api.groq.com/openai/v1
AI_MOCK=false
```

### Opção B — Gemini (via endpoint compatível com OpenAI)

1. Gere uma API Key em https://aistudio.google.com/apikey
2. No `.env` do backend:

```env
GROQ_API_KEY=sua_chave_gemini
GROQ_MODEL=gemini-2.0-flash
GROQ_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MOCK=false
```

As variáveis mantêm o prefixo `GROQ_` por serem os nomes lidos pelo `aiService.js`, independente do
provedor escolhido.

4. Reinicie o servidor após qualquer mudança no `.env`

Sem a chave configurada (ou com `AI_MOCK=true`), o serviço utiliza respostas simuladas realistas —
ideal para testes locais sem depender de API externa.

---

## Arquitetura do Sistema

```
[React SPA]  ──HTTP/REST──►  [Express API]  ──►  [PostgreSQL]
                                   │
                                   └──►  [Groq API]
```

O back-end segue arquitetura em camadas:

- **Routes** — define os endpoints e aplica middlewares de validação
- **Middlewares** — autenticação JWT, autorização RBAC, validação de input, tratamento de erros
- **Controllers** — orquestra a lógica de cada requisição
- **Services** — encapsula a integração com a IA (Groq)
- **Config** — pool de conexão com o PostgreSQL
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
