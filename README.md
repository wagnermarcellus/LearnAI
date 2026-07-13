# 🧠 LearnAI — Plataforma de Aprendizagem Adaptativa com IA

> Plataforma web fullstack onde a IA atua como avaliador diagnóstico, orientador pedagógico e tutor interativo.

---

## 🗂️ Estrutura do Projeto

```
adaptive-learning-platform/
│
├── database/
│   └── schema.sql                    # Schema PostgreSQL completo + seed admin
│
├── docs/
│   └── api.md                        # Documentação completa da API REST
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js                 # Entry point — Express + middlewares globais
│       ├── config/
│       │   └── database.js           # Pool de conexão PostgreSQL (suporta DATABASE_URL)
│       ├── middlewares/
│       │   ├── auth.js               # JWT authenticate + RBAC authorize
│       │   ├── validate.js           # express-validator result handler
│       │   └── errorHandler.js       # Error handler global do Express
│       ├── controllers/
│       │   ├── authController.js     # register, login, me
│       │   ├── learningPathController.js  # CRUD trilhas + enroll
│       │   ├── diagnosticController.js   # Gerar, submeter, resultado
│       │   ├── studyPlanController.js    # Gerar e listar planos
│       │   ├── aiTutorController.js      # Chat + histórico
│       │   └── progressController.js    # Overview + teste de progresso
│       ├── routes/
│       │   ├── auth.js
│       │   ├── learningPaths.js
│       │   ├── diagnostic.js
│       │   ├── studyPlan.js
│       │   ├── aiTutor.js
│       │   └── progress.js
│       ├── services/
│       │   └── aiService.js          # Integração Groq API + mock local
│       └── utils/
│           ├── logger.js             # Winston logger
│           └── response.js           # Helpers success/error padronizados
│
└── frontend/
    ├── package.json
    ├── vite.config.js                # Vite + proxy /api → backend
    ├── index.html
    └── src/
        ├── main.jsx                  # ReactDOM.createRoot
        ├── App.jsx                   # BrowserRouter + todas as rotas
        ├── context/
        │   └── AuthContext.jsx       # Auth state global + login/logout/register
        ├── services/
        │   └── api.js                # Axios instance + interceptor 401
        ├── styles/
        │   └── global.css            # Design system (CSS variables, componentes)
        ├── components/
        │   └── common/
        │       ├── Layout.jsx        # Sidebar + topbar + <Outlet />
        │       └── ProtectedRoute.jsx # Guarda de rotas + RBAC
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

## 🚀 Como Rodar Localmente

### 1. Banco de dados

```bash
# Criar banco
psql -U postgres -c "CREATE DATABASE adaptive_learning;"

# Executar schema (cria tabelas + admin padrão)
psql -U postgres -d adaptive_learning -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL

npm install
npm run dev
# ✅ Servidor em http://localhost:3001
```

Teste: `curl http://localhost:3001/api/health`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# ✅ App em http://localhost:5173
```

### 4. Credenciais padrão

| Campo | Valor |
|-------|-------|
| Email | admin@platform.com |
| Senha | Admin@123 |

---

## 🤖 Configurar IA Real (Groq)

1. Crie conta gratuita em **https://console.groq.com**
2. Gere uma API Key
3. No `.env`:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
AI_MOCK=false
```
4. Reinicie o backend

Sem a chave, `AI_MOCK=true` usa respostas simuladas realistas — perfeito para desenvolvimento.

---

## 🔐 Segurança

| Camada | Implementação |
|--------|--------------|
| Senhas | bcrypt salt 12 |
| Tokens | JWT RS256, expiração configurável |
| Permissões | RBAC por middleware (student / admin) |
| Rate limiting | 100 req / 15 min por IP |
| Headers | Helmet.js (XSS, CSP, HSTS) |
| Validação | express-validator em todas as rotas |
| CORS | Configurado por origem explícita |

---

## 🗄️ Banco de Dados — Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (student / admin) |
| `learning_paths` | Trilhas de aprendizagem |
| `topics` | Tópicos de cada trilha |
| `skills` | Habilidades por tópico |
| `enrollments` | Inscrições aluno ↔ trilha |
| `diagnostic_tests` | Avaliações diagnósticas e de progresso |
| `questions` | Questões geradas pela IA |
| `student_answers` | Respostas dos alunos |
| `study_plans` | Planos de estudo personalizados |
| `ai_interactions` | Histórico do chat com o tutor |
| `user_badges` | Conquistas / badges |
| `xp_events` | Registro de XP ganho |

---

## 📡 API — Endpoints Principais

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/learning-paths
GET    /api/learning-paths/:id
POST   /api/learning-paths          (admin)
POST   /api/learning-paths/:id/enroll
GET    /api/learning-paths/my-enrollments

POST   /api/diagnostic/generate
POST   /api/diagnostic/submit
GET    /api/diagnostic/:id/result
GET    /api/diagnostic/my-tests

POST   /api/study-plan/generate
GET    /api/study-plan

POST   /api/ai/chat
GET    /api/ai/history

GET    /api/progress/overview
POST   /api/progress/test
```

Documentação completa: `docs/api.md`

---

## ☁️ Deploy Rápido

| Serviço | Plataforma | Tier |
|---------|-----------|------|
| Backend + BD | Railway | Gratuito |
| Frontend | Vercel | Gratuito |

```bash
# Backend (Railway)
npm install -g @railway/cli
cd backend && railway login && railway init && railway up

# Frontend (Vercel)
npm install -g vercel
cd frontend && vercel --prod
```

Configure `VITE_API_URL=https://seu-backend.railway.app/api` no Vercel.
