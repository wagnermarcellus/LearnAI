GET http://localhost:3001/api/plans/:id
→ detalhe de uma trilha (learningPathCtrl.getById)

PUT http://localhost:3001/api/plans/:id
→ atualizar trilha (só admin) — body: { "title": "..." }

POST http://localhost:3001/api/plans/:id/enroll
→ matricular aluno na trilha :id (só student)


GET http://localhost:3001/api/plans/diagnostic/:id
→ resultado de um teste diagnóstico (:id = id do DiagnosticTest)

POST http://localhost:3001/api/plans/diagnostic/:id/progress
→ solicitar teste de progresso para o diagnóstico :id

POST http://localhost:3001/api/plans/diagnostic/:id/diagnostic/submit
→ submeter respostas do diagnóstico :id — body: { "answers": [{ "question_id": "...", "selected_option": "A" }] }

POST http://localhost:3001/api/plans/diagnostic/:id/progress/submit
→ submeter respostas do teste de progresso :id (mesmo body do 6)

6a61279510311b2874eb11ee