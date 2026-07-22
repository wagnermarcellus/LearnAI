# Deploy — LearnAI

Este projeto é full-stack: o **GitHub Pages só serve o front-end** (arquivos estáticos). O
back-end (Express + MongoDB + Groq) precisa rodar em outro lugar. Este guia cobre os dois.

---

## 1. Back-end no Render (grátis)

1. Acesse [render.com](https://render.com) e crie uma conta (dá pra logar direto com o GitHub).
2. No painel, clique em **New +** → **Blueprint**.
3. Conecte o repositório `wagnermarcellus/LearnAI`. O Render vai detectar o arquivo `render.yaml`
   na raiz automaticamente e propor um serviço chamado `learnai-backend`.
4. Antes de confirmar, preencha as variáveis marcadas como obrigatórias:

   | Variável | Valor |
   |----------|-------|
   | `MONGODB_URI` | a connection string do seu cluster no MongoDB Atlas |
   | `JWT_SECRET` | uma string aleatória longa (gere uma nova — não reuse a do `.env` local) |
   | `GROQ_API_KEY` | sua chave da Groq |
   | `CORS_ORIGIN` | `https://wagnermarcellus.github.io` |

5. Clique em **Apply** / **Deploy Blueprint**. O primeiro deploy leva alguns minutos.
6. Quando terminar, copie a URL pública que o Render gerou (algo como
   `https://learnai-backend.onrender.com`).

> **Plano free do Render "dorme"** depois de ~15 min sem uso. A primeira requisição depois disso
> demora uns 30–50s pra "acordar" o servidor — é normal, não é erro.

### 1a. Liberar o MongoDB Atlas para o Render

O Atlas, por padrão, só libera o IP que você configurou (o seu, de casa). O Render usa IPs
dinâmicos, então:

1. No Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`).
2. Isso é aceitável para um projeto de estudo/demonstração; não faça isso em produção real sem
   outras camadas de segurança.

---

## 2. Front-end no GitHub Pages

1. No GitHub, vá em **Settings → Pages** do repositório e mude **Source** para
   **GitHub Actions** (só precisa fazer isso uma vez).
2. Vá em **Settings → Secrets and variables → Actions → aba Variables** → **New repository
   variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** a URL do Render + `/api`, por exemplo:
     `https://learnai-backend.onrender.com/api`
3. Dê um push em `main` (ou rode o workflow manualmente em **Actions → Deploy Frontend to GitHub
   Pages → Run workflow**).
4. Em alguns minutos o site estará em:
   **`https://wagnermarcellus.github.io/LearnAI/`**

O workflow (`.github/workflows/deploy-pages.yml`) builda o React com Vite e publica a pasta
`dist/` automaticamente a cada push em `main`.

---

## 3. Testando

1. Abra `https://wagnermarcellus.github.io/LearnAI/`.
2. Faça login com `admin@platform.com` / `Admin@123` (ou cadastre um aluno novo).
3. Se der erro de rede no login, espere ~1 min (o Render pode estar "acordando") e tente de novo.
4. Se der erro de CORS no console do navegador, confira se `CORS_ORIGIN` no Render está exatamente
   `https://wagnermarcellus.github.io` (sem barra no final).

---

## Resumo do que já está pronto no repositório

- `render.yaml` — Blueprint do back-end para o Render.
- `.github/workflows/deploy-pages.yml` — build e publicação automática do front-end.
- `frontend/vite.config.js` — usa `base: '/LearnAI/'` no build de produção (via env
  `GITHUB_PAGES=true`, setado pelo workflow).
- `frontend/src/App.jsx` — usa `HashRouter` (necessário porque o GitHub Pages não faz rewrite de
  rotas do lado do servidor).
- CORS no back-end aceita uma lista separada por vírgula em `CORS_ORIGIN`, então local
  (`http://localhost:5173`) e produção convivem sem conflito.
