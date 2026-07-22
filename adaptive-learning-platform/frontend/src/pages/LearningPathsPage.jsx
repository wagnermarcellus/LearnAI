import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function PathCard({ path }) {
  return (
    <Link to={`/learning-paths/${path.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{ cursor: 'pointer', overflow: 'hidden', transition: 'transform .15s, box-shadow .15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
      >
        <div style={{ height: 6, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{path.title}</h3>
          <p style={{
            color: 'var(--text-muted)', fontSize: '.875rem', lineHeight: 1.6, marginBottom: 14,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {path.description || 'Sem descrição.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="badge badge-primary">{path.topic_count} tópicos</span>
            <span className="badge badge-success">{path.enrolled_count} inscritos</span>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600, fontSize: '.875rem' }}>
            Ver trilha →
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function LearningPathsPage() {
  const [paths,   setPaths]   = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plans')
      .then(r => setPaths(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = paths.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Trilhas de Aprendizagem</h1>
        <p className="page-subtitle">Escolha uma trilha para começar</p>
      </div>

      <input
        className="form-control"
        placeholder="Buscar trilhas..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: 400, marginBottom: 24 }}
      />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Nenhuma trilha encontrada</h3>
          <p>Tente outros termos ou aguarde o administrador criar trilhas.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(path => <PathCard key={path.id} path={path} />)}
        </div>
      )}
    </div>
  )
}
