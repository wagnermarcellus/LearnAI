# 🚀 LearnAI - Plataforma de Aprendizagem Adaptativa com IA

Plataforma de educação inteligente que usa IA para adaptar o conteúdo de aprendizagem às necessidades individuais do aluno.

## 📋 Pré-requisitos

- Node.js v16+ 
- npm v8+
- PostgreSQL v12+
- Git

## ⚙️ Instalação

### 1. Clonar o repositório
```bash
git clone <repo-url>
cd learnai
```

### 2. Instalar dependências

#### Opção A: Instalar tudo de uma vez
```bash
npm run install-all
```

#### Opção B: Instalar manualmente

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configurar variáveis de ambiente

Copie os arquivos `.env.example` para `.env` em cada diretório:

```bash
cp .env.example .env
```

Configure as variáveis necessárias:
- `DATABASE_URL` - URL de conexão PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT
- `GROQ_API_KEY` - Chave da API Groq para IA
- `PORT` - Porta do servidor (padrão: 5000)

### 4. Configurar banco de dados

```bash
cd backend/src/database
psql -U seu_usuario -d seu_banco -f schema.sql
```

## 🏃 Executando o Projeto

### Desenvolvimento

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

O frontend estará disponível em: `http://localhost:5173`
O backend estará disponível em: `http://localhost:5000`

### Produção

**Build:**
```bash
npm run build:frontend
npm run build:backend
```

**Executar backend:**
```bash
npm run start:backend
```

## 📁 Estrutura do Projeto

```
learnai/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Chamadas de API
│   │   ├── contexts/        # Context API
│   │   ├── utils/           # Funções auxiliares
│   │   └── styles/          # CSS global
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express + Node.js
│   ├── src/
│   │   ├── controllers/     # Controllers
│   │   ├── services/        # Lógica de negócio
│   │   ├── routes/          # Definição de rotas
│   │   ├── middleware/      # Middlewares
│   │   ├── database/        # BD e migrations
│   │   ├── models/          # Modelos de dados
│   │   └── utils/           # Funções auxiliares
│   ├── server.js            # Servidor principal
│   └── package.json
├── docs/                     # Documentação
└── package.json             # Root package.json
```

## 🔧 Tecnologias Utilizadas

### Frontend
- React 18
- Vite
- React Router
- Axios
- CSS3

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (JSON Web Tokens)
- Groq API (IA)

## 📚 Documentação

- [SETUP.md](docs/SETUP.md) - Guia detalhado de configuração
- [API.md](docs/API.md) - Documentação da API
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura do projeto
- [FAQ.md](docs/FAQ.md) - Perguntas frequentes

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
- Verifique se PostgreSQL está rodando
- Confirme as credenciais em `.env`
- Verifique se a database foi criada com `schema.sql`

### Porta já em uso
- Backend: Mude a variável `PORT` em `.env`
- Frontend: Vite usará a próxima porta disponível automaticamente

### Módulos não encontrados
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente

## 📝 Licença

MIT

## 👥 Autores

Projeto acadêmico de Aprendizagem Adaptativa com IA
