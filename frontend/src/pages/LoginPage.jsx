import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errMsg, setErrMsg]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrMsg('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🧠</div>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>LearnAI</h1>
          <p style={{ color: 'rgba(255,255,255,.8)', marginTop: 4 }}>
            Plataforma de Aprendizagem Adaptativa
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Entrar na plataforma</h2>

            {errMsg && <div className="alert alert-error">{errMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-control" type="email"
                  placeholder="seu@email.com"
                  value={form.email} onChange={set('email')} required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  className="form-control" type="password"
                  placeholder="••••••••"
                  value={form.password} onChange={set('password')} required
                />
              </div>
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <div className="spinner" /> : '🚀 Entrar'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.875rem', color: 'var(--text-muted)' }}>
              Não tem conta?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,.7)', fontSize: '.8rem' }}>
          Admin padrão: admin@platform.com / Admin@123
        </p>
      </div>
    </div>
  )
}
