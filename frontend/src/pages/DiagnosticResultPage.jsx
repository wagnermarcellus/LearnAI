import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const levelInfo = {
  beginner:     { emoji: '🌱', label: 'Iniciante',     color: '#10b981' },
  intermediate: { emoji: '📗', label: 'Intermediário', color: '#f59e0b' },
  advanced:     { emoji: '🔥', label: 'Avançado',      color: '#ef4444' },
  expert:       { emoji: '⚡', label: 'Expert',        color: '#8b5cf6' },
}

export default function DiagnosticResultPage() {
  const { testId }            = useParams()
  const navigate              = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/diagnostic/${testId}/result`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [testId])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  if (!data) return <div className="empty-state"><h3>Resultado não encontrado</h3></div>

  const { test, answers } = data
  const score    = parseFloat(test.score)
  const lvl      = levelInfo[test.level_assigned] || levelInfo.beginner
  const analysis = test.analysis

  const correct = answers.filter(a => a.is_correct).length

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Score hero */}
      <div style={{
        background: score >= 70
          ? 'linear-gradient(135deg,#10b981,#059669)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        borderRadius: 16, padding: '40px 32px',
        textAlign: 'center', color: 'white', marginBottom: 24,
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>{lvl.emoji}</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900 }}>{score.toFixed(1)}%</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: .9, marginTop: 4 }}>
          Nível: {lvl.label}
        </div>
        <div style={{ opacity: .75, marginTop: 6 }}>
          {correct} de {answers.length} questões corretas · {test.path_title}
        </div>
      </div>

      {/* AI analysis */}
      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>

          {analysis.summary && (
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>📊 Análise Pedagógica</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{analysis.summary}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {analysis.strengths?.length > 0 && (
              <div className="card" style={{ borderLeft: '3px solid #10b981' }}>
                <div className="card-body">
                  <h4 style={{ fontWeight: 700, color: '#10b981', marginBottom: 10 }}>✅ Pontos Fortes</h4>
                  <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analysis.strengths.map((s, i) => <li key={i} style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {analysis.weaknesses?.length > 0 && (
              <div className="card" style={{ borderLeft: '3px solid #ef4444' }}>
                <div className="card-body">
                  <h4 style={{ fontWeight: 700, color: '#ef4444', marginBottom: 10 }}>⚠️ A Melhorar</h4>
                  <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analysis.weaknesses.map((w, i) => <li key={i} style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {analysis.motivational_message && (
            <div className="alert alert-info" style={{ fontSize: '1rem', fontWeight: 500 }}>
              💬 {analysis.motivational_message}
            </div>
          )}
        </div>
      )}

      {/* Gabarito */}
      {answers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📋 Gabarito Detalhado</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {answers.map((a, i) => (
              <div key={i} className="card" style={{ borderLeft: `3px solid ${a.is_correct ? '#10b981' : '#ef4444'}` }}>
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                    <span>{a.is_correct ? '✅' : '❌'}</span>
                    <p style={{ fontWeight: 500, fontSize: '.9rem' }}>{a.question_text}</p>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', paddingLeft: 26 }}>
                    Sua resposta: <strong>{a.selected_option}</strong> · Correta: <strong>{a.correct_option}</strong>
                    {a.explanation && <p style={{ marginTop: 4 }}>💡 {a.explanation}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/study-plan')}>📋 Ver Plano de Estudo</button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/tutor')}>🤖 Falar com Tutor IA</button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/progress')}>📈 Meu Progresso</button>
      </div>
    </div>
  )
}
