import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const diffColor = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444', expert: '#8b5cf6' }

export default function DiagnosticTestPage({ mode = 'diagnostic' }) {
  const { pathId }   = useParams()
  const navigate     = useNavigate()
  const [test,       setTest]       = useState(null)
  const [questions,  setQuestions]  = useState([])
  const [answers,    setAnswers]    = useState({})
  const [current,    setCurrent]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errMsg,     setErrMsg]     = useState('')

  const isProgress = mode === 'progress'

  useEffect(() => {
    const request = isProgress
      ? api.post(`/plans/diagnostic/${pathId}/progress`)
      : api.post('/plans/diagnostic', { learning_path_id: pathId })

    request
      .then(r => { setTest(r.data.data.test); setQuestions(r.data.data.questions) })
      .catch(err => setErrMsg(err.response?.data?.message || 'Erro ao gerar avaliação'))
      .finally(() => setLoading(false))
  }, [pathId, isProgress])

  const pick = (option) => {
    setAnswers(prev => ({ ...prev, [questions[current].id]: option }))
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 280)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const answersArray = Object.entries(answers).map(([question_id, selected_option]) => ({
        question_id,
        selected_option,
      }))
      const suffix = isProgress ? 'progress' : 'diagnostic'
      await api.post(`/plans/diagnostic/${pathId}/${suffix}/submit`, { answers: answersArray })
      navigate(`/diagnostic/${test.id}/result`)
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Erro ao enviar respostas')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Gerando avaliação personalizada...</p>
    </div>
  )

  if (errMsg) return (
    <div className="alert alert-error" style={{ maxWidth: 500, margin: '40px auto' }}>{errMsg}</div>
  )

  if (!questions.length) return null

  const q        = questions[current]
  const answered = Object.keys(answers).length
  const progress = (answered / questions.length) * 100

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{isProgress ? 'Avaliação de Progresso' : 'Avaliação Diagnóstica'}</h1>
        <p className="page-subtitle">
          {isProgress
            ? 'Responda para medirmos sua evolução nesta trilha'
            : 'Responda para personalizarmos seu plano de aprendizagem'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.875rem', fontWeight: 600, marginBottom: 8 }}>
            <span>Questão {current + 1} de {questions.length}</span>
            <span style={{ color: 'var(--primary)' }}>{Math.round(progress)}% respondido</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.7, flex: 1 }}>
              {q.question_text}
            </p>
            <span
              className="badge"
              style={{ flexShrink: 0, background: diffColor[q.difficulty] + '20', color: diffColor[q.difficulty] }}
            >
              {q.difficulty}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options?.map(opt => {
              const selected = answers[q.id] === opt.label
              return (
                <button
                  key={opt.label}
                  onClick={() => pick(opt.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    borderRadius: 8, border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                    background: selected ? 'var(--primary-light)' : 'var(--surface)',
                    color: selected ? 'var(--primary-dark)' : 'var(--text)',
                    fontWeight: selected ? 600 : 400, textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '.9rem', transition: 'all .15s',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: selected ? 'var(--primary)' : 'var(--border)',
                    color: selected ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.8rem',
                  }}>
                    {opt.label}
                  </span>
                  {opt.text}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← Anterior
        </button>

        {current < questions.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setCurrent(c => c + 1)}
            disabled={!answers[q.id]}
          >
            Próxima →
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={submit}
            disabled={answered < questions.length || submitting}
          >
            {submitting ? <div className="spinner" /> : 'Finalizar Avaliação'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '.75rem',
              background: answers[questions[i].id] ? 'var(--secondary)' : i === current ? 'var(--primary)' : 'var(--border)',
              color: answers[questions[i].id] || i === current ? 'white' : 'var(--text-muted)',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
