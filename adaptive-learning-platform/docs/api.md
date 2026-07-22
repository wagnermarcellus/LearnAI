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

## Trilhas de Aprendizagem

### GET /learning-paths 🔒

Lista todas as trilhas ativas com contagem de tópicos e inscritos.

### GET /learning-paths/my-enrollments 🔒 (student)

Retorna as trilhas em que o aluno autenticado está inscrito.

### GET /learning-paths/:id 🔒

Retorna os detalhes de uma trilha, incluindo tópicos e habilidades. Para alunos, inclui o campo `is_enrolled`.

### POST /learning-paths 🔒 (admin)

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

**Resposta 201:** dados da trilha criada.

### POST /learning-paths/:id/enroll 🔒 (student)

Inscreve o aluno na trilha. Operação idempotente.

---

## Avaliação Diagnóstica

### POST /diagnostic/generate 🔒 (student)

Gera uma avaliação diagnóstica com 10 questões via IA. O aluno deve estar inscrito na trilha.

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

### POST /diagnostic/submit 🔒 (student)

Submete as respostas e recebe o resultado com análise pedagógica gerada pela IA.

**Body:**
```json
{
  "test_id": "objectId",
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

### GET /diagnostic/my-tests 🔒

Lista todas as avaliações do aluno autenticado.

### GET /diagnostic/:id/result 🔒

Retorna o resultado completo de uma avaliação, incluindo gabarito e explicações.

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

### POST /progress/test 🔒 (student)

Solicita uma avaliação de progresso com dificuldade adaptativa.

**Body:**
```json
{ "learning_path_id": "objectId" }
```

**Resposta 201:** nova avaliação gerada com questões adaptadas ao desempenho anterior.

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
