import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const levelColor = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444', expert: '#8b5cf6' }
const levelLabel = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado', expert: 'Expert' }

export default function ProgressPage() {
  const navigate                   = useNavigate()
  const [data,       setData]      = useState(null)
  const [loading,    setLoading]   = useState(true)
  const [requesting, setRequesting]= useState(false)
  const [pathId,     setPathId]    = useState('')

  useEffect(() => {
    api.get('/progress/overview')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  const requestTest = async () => {
    if (!pathId) return
    setRequesting(true)
    try {
      const res = await api.post(`/plans/diagnostic/${pathId}/progress`)
      if (res.data.data?.test?.id) {
        navigate(`/diagnostic/${res.data.data.test.id}/result`)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao solicitar avaliação')
    } finally { setRequesting(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  const xp    = data?.user?.xp || 0
  const level = Math.floor(xp / 100) + 1
  const xpPct = xp % 100

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Meu Progresso</h1>
        <p className="page-subtitle">Acompanhe sua evolução na plataforma</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '3.5rem' }}>🎖️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>Nível {level}</div>
          <div style={{ opacity: .85, marginBottom: 10 }}>{xp} XP acumulados</div>
          <div style={{ maxWidth: 260 }}>
            <div className="progress-bar" style={{ background: 'rgba(255,255,255,.3)' }}>
              <div className="progress-bar-fill" style={{ width: `${xpPct}%`, background: 'white' }} />
            </div>
            <div style={{ fontSize: '.72rem', opacity: .75, marginTop: 4 }}>
              {100 - xpPct} XP para o próximo nível
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '.8rem', opacity: .8, marginBottom: 4 }}>Perguntas ao tutor</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.ai_interactions || 0}</div>
        </div>
      </div>

      {data?.enrollments?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Solicitar Avaliação de Progresso</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: 14 }}>
              Gere uma nova avaliação com dificuldade adaptativa baseada no seu histórico.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={pathId}
                onChange={e => setPathId(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              >
                <option value="">Selecione uma trilha...</option>
                {data.enrollments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <button
                className="btn btn-primary"
                onClick={requestTest}
                disabled={!pathId || requesting}
              >
                {requesting ? <div className="spinner" /> : 'Gerar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {data?.tests?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Histórico de Avaliações</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Trilha', 'Tipo', 'Nota', 'Nível', 'Data'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tests.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{t.path_title}</td>
                    <td style={{ padding: '12px 16px' }}><span className="badge badge-info">{t.type}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: levelColor[t.level_assigned] }}>
                          {parseFloat(t.score).toFixed(1)}%
                        </span>
                        <div style={{ width: 50, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.score}%`, background: levelColor[t.level_assigned] }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: levelColor[t.level_assigned] + '20', color: levelColor[t.level_assigned] }}>
                        {levelLabel[t.level_assigned]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      {new Date(t.completed_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.enrollments?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Trilhas Inscritas</h2>
          <div className="grid-2">
            {data.enrollments.map((e, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{e.title}</h3>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    Inscrito em {new Date(e.enrolled_at).toLocaleDateString('pt-BR')}
                  </p>
                  {e.completed_at && (
                    <span className="badge badge-success" style={{ marginTop: 8 }}>Concluída</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.badges?.length > 0 && (
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Conquistas</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {data.badges.map(b => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.5rem' }}>🏅</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.875rem' }}>
                      {b.badge.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                      {new Date(b.earned_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
