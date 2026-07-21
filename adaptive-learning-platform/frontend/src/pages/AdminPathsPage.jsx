import React, { useState, useEffect } from 'react'
import api from '../services/api'

const emptyTopic = () => ({ title: '', description: '', skills: [{ name: '' }] })
const emptyForm  = () => ({ title: '', description: '', topics: [emptyTopic()] })

export default function AdminPathsPage() {
  const [paths,   setPaths]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(emptyForm())
  const [saving,  setSaving]  = useState(false)
  const [errMsg,  setErrMsg]  = useState('')
  const [okMsg,   setOkMsg]   = useState('')

  useEffect(() => {
    api.get('/learning-paths')
      .then(r => setPaths(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const addTopic    = () => setForm(f => ({ ...f, topics: [...f.topics, emptyTopic()] }))
  const removeTopic = (i) => setForm(f => ({ ...f, topics: f.topics.filter((_, idx) => idx !== i) }))
  const updateTopic = (i, field, value) => setForm(f => {
    const topics = [...f.topics]
    topics[i] = { ...topics[i], [field]: value }
    return { ...f, topics }
  })

  const addSkill    = (ti) => setForm(f => {
    const topics = [...f.topics]
    topics[ti].skills = [...topics[ti].skills, { name: '' }]
    return { ...f, topics }
  })
  const removeSkill = (ti, si) => setForm(f => {
    const topics = [...f.topics]
    topics[ti].skills = topics[ti].skills.filter((_, idx) => idx !== si)
    return { ...f, topics }
  })
  const updateSkill = (ti, si, value) => setForm(f => {
    const topics = [...f.topics]
    topics[ti].skills[si] = { name: value }
    return { ...f, topics }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErrMsg(''); setOkMsg('')
    try {
      const res = await api.post('/learning-paths', {
        title:       form.title,
        description: form.description,
        topics:      form.topics.filter(t => t.title.trim()),
      })
      setPaths(prev => [res.data.data, ...prev])
      setForm(emptyForm())
      setOkMsg('Trilha criada com sucesso!')
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Erro ao criar trilha')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gerenciar Trilhas</h1>
        <p className="page-subtitle">Crie e gerencie trilhas de aprendizagem</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Nova Trilha</h2>
            {errMsg && <div className="alert alert-error">{errMsg}</div>}
            {okMsg  && <div className="alert alert-success">{okMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  className="form-control"
                  placeholder="Ex: Desenvolvimento Web Full-Stack"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Descreva a trilha..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Tópicos</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addTopic}>
                    + Tópico
                  </button>
                </div>

                {form.topics.map((topic, ti) => (
                  <div key={ti} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        className="form-control"
                        placeholder={`Tópico ${ti + 1}`}
                        required
                        value={topic.title}
                        onChange={e => updateTopic(ti, 'title', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {form.topics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTopic(ti)}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '0 10px', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <input
                      className="form-control"
                      placeholder="Descrição do tópico"
                      style={{ marginBottom: 8, fontSize: '.85rem' }}
                      value={topic.description}
                      onChange={e => updateTopic(ti, 'description', e.target.value)}
                    />

                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Habilidades
                      </div>
                      {topic.skills.map((skill, si) => (
                        <div key={si} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          <input
                            className="form-control"
                            placeholder={`Habilidade ${si + 1}`}
                            style={{ fontSize: '.82rem' }}
                            value={skill.name}
                            onChange={e => updateSkill(ti, si, e.target.value)}
                          />
                          {topic.skills.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSkill(ti, si)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 6px', fontWeight: 700 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addSkill(ti)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, padding: 0 }}
                      >
                        + habilidade
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? <><div className="spinner" /> Criando...</> : 'Criar Trilha'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <h2 style={{ fontWeight: 700, marginBottom: 14 }}>Trilhas Existentes ({paths.length})</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner spinner-dark" />
            </div>
          ) : paths.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>Nenhuma trilha ainda</h3>
            </div>
          ) : paths.map(path => (
            <div key={path.id} className="card" style={{ marginBottom: 10 }}>
              <div className="card-body" style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{path.title}</div>
                {path.description && (
                  <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                    {path.description.length > 100 ? path.description.slice(0, 100) + '...' : path.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-primary">{path.topic_count} tópicos</span>
                  <span className="badge badge-success">{path.enrolled_count} inscritos</span>
                  <span className={`badge ${path.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {path.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
