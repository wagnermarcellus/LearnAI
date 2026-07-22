import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const SUGGESTIONS = [
  'O que é React e como funciona?',
  'Explique o padrão MVC',
  'Como funciona autenticação JWT?',
  'O que são Promises em JavaScript?',
  'Como criar uma API REST com Express?',
  'Qual a diferença entre SQL e NoSQL?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 8, flexShrink: 0, fontSize: '1rem',
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '76%', padding: '12px 16px', fontSize: '.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--primary)' : 'var(--surface)',
        color:      isUser ? 'white' : 'var(--text)',
        border:     isUser ? 'none' : '1px solid var(--border)',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '.85rem',
        }}>
          EU
        </div>
      )}
    </div>
  )
}

export default function AITutorPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu tutor de IA. Posso explicar conceitos, tirar dúvidas e adaptar as explicações ao seu nível atual. O que você quer aprender hoje?' },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [pathId,  setPathId]  = useState('')
  const [paths,   setPaths]   = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/plans/my-enrollments')
      .then(r => setPaths(r.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        learning_path_id: pathId || undefined,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocorreu um erro. Tente novamente.' }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Tutor IA</h1>
            <p className="page-subtitle">Explicações adaptadas ao seu nível de conhecimento</p>
          </div>
          <select
            className="form-control"
            value={pathId}
            onChange={e => setPathId(e.target.value)}
            style={{ width: 'auto', minWidth: 220 }}
          >
            <option value="">Sem contexto de trilha</option>
            {paths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>
                🤖
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--primary)',
                      animation: `bounce .9s ${i * .15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-secondary btn-sm" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Digite sua dúvida... (Enter para enviar)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{ flexShrink: 0 }}
          >
            {loading ? <div className="spinner" /> : 'Enviar'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(.7); opacity: .5; }
          40%            { transform: scale(1);  opacity: 1;  }
        }
      `}</style>
    </div>
  )
}
