# Documentação da API — LearnAI

**Base URL:** `http://localhost:3001/api`

Rotas protegidas exigem o header:
```
Authorization: Bearer <token>
```

---

## Autenticação

### POST /auth/register

Cadastra um novo usuário com perfil `student`.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "Senha@123"
}
```

**Regras de validação:**
- `name`: 2–150 caracteres
- `email`: formato válido
- `password`: mínimo 8 caracteres, ao menos 1 maiúscula e 1 número

**Resposta 201:**
```json
{
  "success": true,
  "message": "Conta criada com sucesso",
  "data": {
    "user": { "id": "objectId", "name": "João Silva", "email": "...", "role": "student", "xp": 0, "level": 1 },
    "token": "eyJ..."
  }
}
```

---

### POST /auth/login

Autentica um usuário existente.

**Body:**
```json
{ "email": "joao@email.com", "password": "Senha@123" }
```

**Resposta 200:** mesma estrutura do register.

---

### GET /auth/me 🔒

Retorna os dados do usuário autenticado pelo token.

**Resposta 200:**
```json
{
  "data": { "id": "objectId", "name": "...", "email": "...", "role": "student", "xp": 150, "level": 2 }
}
```

---

## Planos de Ensino (Trilhas de Aprendizagem)

> Todas as rotas de planos e avaliações vivem sob o prefixo `/plans`.

### GET /plans 🔒

Lista todos os planos de ensino ativos com contagem de tópicos e inscritos.

### GET /plans/my-enrollments 🔒 (student)

Retorna os planos em que o aluno autenticado está inscrito.

### GET /plans/:id 🔒

Retorna os detalhes de um plano, incluindo tópicos e habilidades. Para alunos, inclui o campo `is_enrolled`.

### POST /plans 🔒 (admin)

**Body:**
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
        { "name": "Promises" },
        { "name": "async/await" }
      ]
    }
  ]
}
```

**Resposta 201:** dados do plano criado.

### POST /plans/:id/enroll 🔒 (student)

Inscreve o aluno no plano (`:id` = id do plano). Operação idempotente.

---

## Avaliações Diagnósticas e de Progresso

### GET /plans/diagnostic 🔒

Lista todas as avaliações (diagnósticas e de progresso) do aluno autenticado.

### GET /plans/diagnostic/:id 🔒

Retorna o resultado completo de uma avaliação (`:id` = id da própria avaliação), incluindo gabarito e explicações.

### POST /plans/diagnostic 🔒 (student)

Gera uma avaliação diagnóstica com 10 questões via IA. O aluno deve estar inscrito no plano.

**Body:**
```json
{ "learning_path_id": "objectId" }
```

**Resposta 201:**
```json
{
  "data": {
    "test": { "id": "objectId", "status": "pending", "type": "diagnostic" },
    "questions": [
      {
        "id": "objectId",
        "question_text": "O que é uma Promise em JavaScript?",
        "options": [
          { "label": "A", "text": "Um tipo primitivo de dado" },
          { "label": "B", "text": "Um objeto que representa a conclusão de uma operação assíncrona" },
          { "label": "C", "text": "Uma função síncrona especial" },
          { "label": "D", "text": "Um loop assíncrono nativo" }
        ],
        "difficulty": "intermediate",
        "order_index": 0
      }
    ]
  }
}
```

> O campo `correct_option` não é retornado ao aluno.

### POST /plans/diagnostic/:id/progress 🔒 (student)

Solicita uma avaliação de progresso com dificuldade adaptativa (`:id` = id do plano). Requer uma
avaliação diagnóstica concluída nesse plano.

**Resposta 201:** mesmo formato de `POST /plans/diagnostic`, com `test.type = "progress"`.

### POST /plans/diagnostic/:id/diagnostic/submit 🔒 (student)

Submete as respostas da avaliação **diagnóstica** pendente do plano `:id` e recebe o resultado com
análise pedagógica gerada pela IA.

**Body:**
```json
{
  "answers": [
    { "question_id": "objectId", "selected_option": "B" }
  ]
}
```

**Resposta 200:**
```json
{
  "data": {
    "score": 75.0,
    "correct": 7,
    "total": 10,
    "level": "advanced",
    "xp_gained": 35,
    "test_id": "objectId",
    "analysis": {
      "summary": "O aluno demonstrou...",
      "strengths": ["Bom entendimento de..."],
      "weaknesses": ["Dificuldade com..."],
      "recommendations": ["Praticar..."],
      "motivational_message": "Ótimo resultado!..."
    }
  }
}
```

### POST /plans/diagnostic/:id/progress/submit 🔒 (student)

Igual à rota acima, mas submete a avaliação de **progresso** pendente do plano `:id`. Mesmo formato
de body e resposta.

---

## Plano de Estudo

### POST /study-plan/generate 🔒 (student)

Gera um plano de estudo personalizado. Requer avaliação diagnóstica concluída na trilha.

**Body:**
```json
{
  "learning_path_id": "objectId",
  "goals": "Conseguir meu primeiro emprego como desenvolvedor em 6 meses"
}
```

**Resposta 201:** plano com fases, cronograma, marcos e dicas.

### GET /study-plan 🔒

Lista planos ativos do aluno. Query param opcional: `?learning_path_id=objectId`

---

## Tutor IA

### POST /ai/chat 🔒

Envia uma mensagem ao tutor. A resposta é adaptada ao nível do aluno.

**Body:**
```json
{
  "message": "O que é injeção de dependência?",
  "learning_path_id": "objectId"
}
```

**Resposta 200:**
```json
{
  "data": {
    "response": "Injeção de dependência é um padrão...",
    "student_level": "intermediate"
  }
}
```

### GET /ai/history 🔒

Retorna o histórico de chat. Query params: `?learning_path_id=objectId&limit=50`

---

## Progresso

### GET /progress/overview 🔒

Retorna uma visão geral do aluno: XP, nível, avaliações, inscrições, badges e eventos de XP.

> Solicitar uma nova avaliação de progresso agora é feito em `POST /plans/diagnostic/:id/progress`
> (veja a seção "Avaliações Diagnósticas e de Progresso" acima).

---

## Códigos de Resposta

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Requisição inválida (dados faltando ou incorretos) |
| 401 | Token ausente, inválido ou expirado |
| 403 | Permissão insuficiente (RBAC) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: e-mail já cadastrado) |
| 422 | Erro de validação dos campos |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

## Estrutura de Resposta Padrão

**Sucesso:**
```json
{ "success": true, "message": "string", "data": {} }
```

**Erro:**
```json
{ "success": false, "message": "string", "errors": [] }
```
