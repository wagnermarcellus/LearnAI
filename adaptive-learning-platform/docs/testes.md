# Plano de Testes — LearnAI

**Projeto:** Plataforma Web de Aprendizagem Adaptativa com IA

---

## 1. Testes de Autenticação

| ID | Cenário | Dados de Entrada | Resultado Esperado |
|----|---------|------------------|--------------------|
| T01 | Cadastro com dados válidos | name, email único, senha forte | Status 201, retorna token JWT |
| T02 | Cadastro com e-mail duplicado | e-mail já existente | Status 409, mensagem de conflito |
| T03 | Cadastro com senha fraca | senha sem maiúscula | Status 422, erro de validação |
| T04 | Login com credenciais corretas | e-mail + senha válidos | Status 200, retorna token JWT |
| T05 | Login com senha incorreta | senha errada | Status 401, "Credenciais inválidas" |
| T06 | Acesso a rota protegida sem token | sem header Authorization | Status 401 |
| T07 | Acesso a rota de admin com perfil aluno | token de student | Status 403 |

---

## 2. Testes de Trilhas

| ID | Cenário | Resultado Esperado |
|----|---------|---------------------|
| T08 | Admin cria trilha com tópicos | Status 201, trilha persistida no banco |
| T09 | Aluno lista trilhas disponíveis | Status 200, lista com contagem de tópicos |
| T10 | Aluno se inscreve em trilha | Status 200, enrollment registrado |
| T11 | Inscrição duplicada | Operação idempotente, sem erro |
| T12 | Aluno acessa detalhes da trilha inscrita | Campo `is_enrolled: true` na resposta |

---

## 3. Testes de Avaliação Diagnóstica

| ID | Cenário | Resultado Esperado |
|----|---------|---------------------|
| T13 | Aluno gera avaliação sem inscrição | Status 400, "Você precisa se inscrever" |
| T14 | Aluno gera avaliação após inscrição | Status 201, 10 questões sem `correct_option` |
| T15 | Aluno submete respostas | Status 200, score calculado, análise da IA |
| T16 | Submissão de avaliação já respondida | Status 404, "Teste já respondido" |
| T17 | Aluno visualiza resultado | Status 200, gabarito com explicações |

---

## 4. Testes de Plano de Estudo e Tutor

| ID | Cenário | Resultado Esperado |
|----|---------|---------------------|
| T18 | Gerar plano sem diagnóstico | Status 400, mensagem de requisito |
| T19 | Gerar plano após diagnóstico | Status 201, plano estruturado por fases |
| T20 | Chat com tutor | Status 200, resposta adaptada ao nível |
| T21 | Histórico de chat | Status 200, mensagens em ordem cronológica |

---

## 5. Testes de Segurança

| ID | Cenário | Resultado Esperado |
|----|---------|---------------------|
| T22 | Injeção SQL via parâmetros | Query parametrizada bloqueia a injeção |
| T23 | Token expirado | Status 401, "Token expirado" |
| T24 | Rate limit excedido | Status 429 após 100 requisições/15min |

---

## 6. Teste de Integração — Fluxo Completo

```
1. POST /auth/register         → Cria conta de aluno
2. POST /auth/login            → Obtém token
3. POST /learning-paths        → Admin cria trilha (token admin)
4. POST /learning-paths/:id/enroll → Aluno se inscreve
5. POST /diagnostic/generate   → Gera avaliação (modo mock IA)
6. POST /diagnostic/submit     → Submete respostas
7. POST /study-plan/generate   → Gera plano personalizado
8. POST /ai/chat               → Faz pergunta ao tutor
9. GET  /progress/overview     → Verifica XP e histórico
```

---

## 7. Como Executar os Testes Manualmente

```bash
# Verificar que o servidor está rodando
curl http://localhost:3001/api/health

# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"Teste@123"}'

# Fazer login e salvar o token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"Teste@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Listar trilhas
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/learning-paths
```
