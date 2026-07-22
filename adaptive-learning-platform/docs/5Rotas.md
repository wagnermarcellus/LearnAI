# 5 Rotas — Planos de Ensino e Avaliações

Guia de teste no Postman para as 5 rotas do módulo de Planos de Ensino e Avaliações,
conforme a estrutura definida no quadro:

```
/plans/diagnostic
  /:id/progress
  /:id/diagnostic/submit
  /:id/progress/submit
/plans
```

**Base URL:** `http://localhost:3001/api`

Todas as rotas abaixo exigem o header:

```
Authorization: Bearer <token>
```

O `<token>` vem da resposta de `/auth/login` (veja o passo 0). No Postman, cole isso na aba
**Headers** da requisição, ou use a aba **Authorization** → tipo **Bearer Token** → cole só o
token (sem a palavra "Bearer").

---

## Passo 0 — Login (obter o token)

Antes de testar qualquer rota abaixo, faça login para obter o token JWT.

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/auth/login`
- **Body → raw → JSON:**
```json
{
  "email": "admin@platform.com",
  "password": "Admin@123"
}
```
- **Resposta 200:** copie o valor de `data.token` — é isso que vai no header `Authorization` de
  todas as rotas seguintes.

> Rotas de **criar plano** (`POST /plans`) exigem um usuário `admin`. Rotas de **avaliação**
> (diagnóstico/progresso) exigem um usuário `student`. Para testar o fluxo completo, cadastre
> também um aluno em `POST /auth/register` (cria automaticamente com papel `student`) e faça
> login com ele para pegar um segundo token.

---

## Rota 1 — `GET` e `POST /plans` (Planos de Ensino)

Listar, ver e criar planos de ensino (trilhas).

### 1a. Listar planos

- **Método:** `GET`
- **URL:** `http://localhost:3001/api/plans`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** nenhum

### 1b. Criar um plano (precisa de token de **admin**)

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/plans`
- **Headers:** `Authorization: Bearer <token-admin>`
- **Body → raw → JSON:**
```json
{
  "title": "Desenvolvimento Web Full-Stack",
  "description": "Aprenda React, Node.js e MongoDB do zero ao deploy.",
  "topics": [
    {
      "title": "JavaScript Moderno",
      "description": "ES6+, async/await, módulos",
      "skills": [
        { "name": "Arrow functions" },
        { "name": "Promises" }
      ]
    }
  ]
}
```
- **Resposta 201:** copie o `data.id` — é o `learning_path_id` usado nas próximas rotas.

### 1c. Ver um plano específico

- **Método:** `GET`
- **URL:** `http://localhost:3001/api/plans/{{planId}}`

### 1d. Inscrever o aluno no plano (precisa de token de **student**)

Necessário antes de gerar qualquer avaliação.

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/plans/{{planId}}/enroll`
- **Headers:** `Authorization: Bearer <token-student>`
- **Body:** nenhum

---

## Rota 2 — `POST /plans/diagnostic` (criar avaliação diagnóstica)

Gera uma avaliação diagnóstica de 10 questões via IA, vinculada a um plano (token de **student**,
já inscrito no plano).

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/plans/diagnostic`
- **Headers:** `Authorization: Bearer <token-student>`
- **Body → raw → JSON:**
```json
{
  "learning_path_id": "{{planId}}"
}
```
- **Resposta 201:** um objeto `test` (status `pending`) e uma lista `questions`. Guarde o `id` de
  cada questão — você vai precisar deles na Rota 4. O `correct_option` não é retornado aqui.

---

## Rota 3 — `POST /plans/diagnostic/:id/progress` (criar avaliação de progresso)

Gera uma avaliação de progresso adaptativa vinculada a um plano. **Requer que o aluno já tenha
uma avaliação diagnóstica concluída nesse mesmo plano** (ou seja, rode a Rota 2 + a submissão
diagnóstica da Rota 4 antes de testar esta).

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/plans/diagnostic/{{planId}}/progress`
- **Headers:** `Authorization: Bearer <token-student>`
- **Body:** nenhum (o `:id` na URL já é o `learning_path_id`)
- **Resposta 201:** mesmo formato da Rota 2, com `test.type = "progress"`.

---

## Rota 4 — `POST /plans/diagnostic/:id/.../submit` (submeter avaliações)

Existem duas variantes — uma para cada tipo de avaliação gerado nas rotas 2 e 3. Em ambas, `:id`
é o **id do plano** (não o id da avaliação), e o backend localiza automaticamente a avaliação
pendente daquele tipo para o aluno logado.

### 4a. Submeter avaliação diagnóstica

- **Método:** `POST`
- **URL:** `http://localhost:3001/api/plans/diagnostic/{{planId}}/diagnostic/submit`
- **Headers:** `Authorization: Bearer <token-student>`
- **Body → raw → JSON:**
```json
{
  "answers": [
    { "question_id": "{{idDaQuestao1}}", "selected_option": "A" },
    { "question_id": "{{idDaQuestao2}}", "selected_option": "B" }
  ]
}
```
  (Use os `id`s de questão retornados na Rota 2. `selected_option` deve ser `"A"`, `"B"`, `"C"` ou `"D"`.)

- **Resposta 200:** `score`, `level`, `xp_gained`, `test_id` e a `analysis` (análise pedagógica
  gerada pela IA).

### 4b. Submeter avaliação de progresso

Idêntico ao 4a, trocando apenas a URL:

- **URL:** `http://localhost:3001/api/plans/diagnostic/{{planId}}/progress/submit`
- **Body:** mesmo formato, usando os `id`s de questão retornados na Rota 3.

---

## Rota 5 — `GET /plans/diagnostic` e `GET /plans/diagnostic/:id` (listar/ver avaliações submetidas)

### 5a. Listar todas as avaliações do aluno

- **Método:** `GET`
- **URL:** `http://localhost:3001/api/plans/diagnostic`
- **Headers:** `Authorization: Bearer <token-student>`
- **Resposta 200:** lista com `type` (diagnostic/progress), `status`, `score`, `level_assigned`,
  `path_title`, etc.

### 5b. Ver o resultado detalhado de uma avaliação

- **Método:** `GET`
- **URL:** `http://localhost:3001/api/plans/diagnostic/{{testId}}`
- **Headers:** `Authorization: Bearer <token-student>`

  (`{{testId}}` aqui é o `test_id` retornado na resposta da Rota 4 — **não** o id do plano.)

- **Resposta 200:** o objeto `test` completo (com `analysis`) e a lista `answers`, cada uma com
  `question_text`, `selected_option`, `correct_option`, `is_correct` e `explanation`.

---

## Resumo rápido (ordem de execução no Postman)

| # | Método | URL | Token |
|---|--------|-----|-------|
| 0 | POST | `/auth/login` | — |
| 1b | POST | `/plans` | admin |
| 1d | POST | `/plans/{{planId}}/enroll` | student |
| 2 | POST | `/plans/diagnostic` | student |
| 4a | POST | `/plans/diagnostic/{{planId}}/diagnostic/submit` | student |
| 3 | POST | `/plans/diagnostic/{{planId}}/progress` | student |
| 4b | POST | `/plans/diagnostic/{{planId}}/progress/submit` | student |
| 5a | GET | `/plans/diagnostic` | student |
| 5b | GET | `/plans/diagnostic/{{testId}}` | student |
