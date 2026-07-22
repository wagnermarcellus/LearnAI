import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function LearningPathDetailPage() {
  const { id }      = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [path,      setPath]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [errMsg,    setErrMsg]    = useState('')

  useEffect(() => {
    api.get(`/plans/${id}`)
      .then(r => setPath(r.data.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleEnroll = async () => {
    setEnrolling(true); setErrMsg('')
    try {
      await api.post(`/plans/${id}/enroll`)
      setPath(prev => ({ ...prev, is_enrolled: true }))
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Erro ao se inscrever')
    } finally { setEnrolling(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  if (!path) return <div className="empty-state"><h3>Trilha não encontrada</h3></div>

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: 16, padding: 32, marginBottom: 32, color: 'white',
      }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 10 }}>{path.title}</h1>
        <p style={{ opacity: .9, marginBottom: 24, maxWidth: 600, lineHeight: 1.7 }}>
          {path.description || 'Sem descrição.'}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,.2)', padding: '4px 12px', borderRadius: 20, fontSize: '.875rem' }}>
            {path.topics?.length || 0} tópicos
          </span>

          {user?.role === 'student' && (
            path.is_enrolled ? (
              <button
                className="btn"
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}
                onClick={() => navigate(`/diagnostic/${id}`)}
              >
                Iniciar Avaliação Diagnóstica
              </button>
            ) : (
              <button
                className="btn"
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 700 }}
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? <div className="spinner spinner-dark" /> : 'Inscrever-se'}
              </button>
            )
          )}
        </div>

        {errMsg && (
          <div style={{ marginTop: 12, background: 'rgba(239,68,68,.25)', padding: '8px 14px', borderRadius: 8, fontSize: '.875rem' }}>
            {errMsg}
          </div>
        )}
      </div>

      <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Conteúdo</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {path.topics?.map((topic, idx) => (
          <div key={topic.id} className="card">
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{topic.title}</h3>
                  {topic.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: 8 }}>
                      {topic.description}
                    </p>
                  )}
                  {topic.skills?.filter(s => s.id).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {topic.skills.filter(s => s.id).map(skill => (
                        <span key={skill.id} className="badge badge-primary" style={{ fontSize: '.72rem' }}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
