import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const levelColor = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444', expert: '#8b5cf6' }

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user }              = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/progress/overview')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const xp    = user?.xp || 0
  const level = Math.floor(xp / 100) + 1
  const xpPct = xp % 100

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Olá, {user?.name?.split(' ')[0]}!</h1>
            <p className="page-subtitle">Bem-vindo à sua jornada de aprendizagem</p>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
              Nível {level} · {xp} XP
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {100 - xpPct} XP para o próximo nível
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <StatCard icon="📚" label="Trilhas inscritas"  value={data?.enrollments?.length || 0} color="#6366f1" />
        <StatCard icon="📝" label="Avaliações feitas"  value={data?.tests?.length || 0}       color="#10b981" />
        <StatCard icon="🤖" label="Perguntas ao tutor" value={data?.ai_interactions || 0}     color="#f59e0b" />
        <StatCard icon="⭐" label="XP total"           value={xp}                             color="#8b5cf6" />
        <StatCard icon="🏅" label="Conquistas"         value={data?.badges?.length || 0}      color="#ef4444" />
        <StatCard icon="🎯" label="Nível atual"        value={level}                          color="#3b82f6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {[
          { to: '/learning-paths', icon: '📚', label: 'Trilhas',        color: '#6366f1' },
          { to: '/tutor',          icon: '🤖', label: 'Tutor IA',       color: '#8b5cf6' },
          { to: '/study-plan',     icon: '📋', label: 'Plano de Estudo',color: '#10b981' },
          { to: '/progress',       icon: '📈', label: 'Progresso',      color: '#f59e0b' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 18px', background: 'var(--surface)',
              borderRadius: 12, border: '1px solid var(--border)',
              fontWeight: 600, color: item.color, boxShadow: 'var(--shadow)',
              transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
          >
            <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {data?.tests?.length > 0 && (
        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Avaliações Recentes</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Trilha', 'Tipo', 'Nota', 'Nível', 'Data'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .5 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tests.slice(0, 6).map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{t.path_title}</td>
                    <td style={{ padding: '12px 16px' }}><span className="badge badge-info">{t.type}</span></td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: parseFloat(t.score) >= 70 ? 'var(--secondary)' : 'var(--danger)' }}>
                      {parseFloat(t.score).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge" style={{ background: levelColor[t.level_assigned] + '20', color: levelColor[t.level_assigned] }}>
                        {t.level_assigned}
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
    </div>
  )
}
