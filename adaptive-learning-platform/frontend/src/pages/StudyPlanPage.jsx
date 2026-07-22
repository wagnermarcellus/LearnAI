import React, { useState, useEffect } from 'react'
import api from '../services/api'

export default function StudyPlanPage() {
  const [plans,      setPlans]      = useState([])
  const [paths,      setPaths]      = useState([])
  const [pathId,     setPathId]     = useState('')
  const [goals,      setGoals]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [errMsg,     setErrMsg]     = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/study-plan').then(r => setPlans(r.data.data || [])),
      api.get('/plans/my-enrollments').then(r => setPaths(r.data.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    if (!pathId) return
    setGenerating(true); setErrMsg('')
    try {
      const res = await api.post('/study-plan/generate', {
        learning_path_id: pathId,
        goals: goals || undefined,
      })
      setPlans(prev => [res.data.data, ...prev.filter(p => p.learning_path_id !== pathId)])
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Erro ao gerar plano')
    } finally { setGenerating(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Plano de Estudo</h1>
        <p className="page-subtitle">Planos personalizados gerados com base no seu diagnóstico</p>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-body">
          <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Gerar Novo Plano</h2>
          {errMsg && <div className="alert alert-error">{errMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Trilha</label>
              <select className="form-control" value={pathId} onChange={e => setPathId(e.target.value)}>
                <option value="">Selecione uma trilha inscrita...</option>
                {paths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Objetivos (opcional)</label>
              <input
                className="form-control"
                placeholder="Ex: Conseguir emprego em 6 meses"
                value={goals}
                onChange={e => setGoals(e.target.value)}
              />
            </div>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            É necessário ter concluído uma avaliação diagnóstica na trilha selecionada.
          </p>
          <button className="btn btn-primary" onClick={generate} disabled={!pathId || generating}>
            {generating ? <><div className="spinner" /> Gerando...</> : 'Gerar Plano Personalizado'}
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>Nenhum plano ainda</h3>
          <p>Complete uma avaliação diagnóstica e gere seu plano acima.</p>
        </div>
      ) : plans.map(plan => {
        const content = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content
        return (
          <div key={plan.id} className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontWeight: 800, marginBottom: 8 }}>{content?.title || plan.path_title}</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {content?.estimated_weeks && <span className="badge badge-primary">{content.estimated_weeks} semanas</span>}
                    {content?.weekly_hours    && <span className="badge badge-success">{content.weekly_hours}h / semana</span>}
                    <span className="badge badge-info">{plan.path_title}</span>
                  </div>
                </div>
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {content?.phases?.map(phase => (
                <div key={phase.phase} style={{ marginBottom: 14, padding: 16, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '.8rem', flexShrink: 0,
                    }}>
                      {phase.phase}
                    </div>
                    <h3 style={{ fontWeight: 700, flex: 1 }}>{phase.title}</h3>
                    <span className="badge badge-primary">{phase.duration_weeks} sem.</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {phase.topics?.map(t => <span key={t} className="badge badge-info">{t}</span>)}
                  </div>
                  {phase.objectives?.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--secondary)', flexShrink: 0 }}>✓</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              ))}

              {content?.milestones?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10 }}>Marcos</h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {content.milestones.map((m, i) => (
                      <div key={i} style={{ padding: '8px 14px', background: 'var(--primary-light)', borderRadius: 8, fontSize: '.8rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Semana {m.week}:</span> {m.goal}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content?.tips?.length > 0 && (
                <div style={{ marginTop: 14, padding: 14, background: '#fffbeb', borderRadius: 10, border: '1px solid #fef3c7' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#92400e' }}>Dicas</h4>
                  {content.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: '.875rem', color: '#78350f', marginBottom: 4 }}>• {tip}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
