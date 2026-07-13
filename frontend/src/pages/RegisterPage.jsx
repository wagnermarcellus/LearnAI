import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [errMsg, setErrMsg]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrMsg('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Erro ao criar conta'
      setErrMsg(msg)
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

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🧠</div>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>LearnAI</h1>
          <p style={{ color: 'rgba(255,255,255,.8)' }}>Crie sua conta gratuita</p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Criar conta</h2>

            {errMsg && <div className="alert alert-error">{errMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input className="form-control" placeholder="Seu nome" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-control" type="password" placeholder="Mín. 8 chars, 1 maiúscula, 1 número" value={form.password} onChange={set('password')} required />
              </div>
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <div className="spinner" /> : '✨ Criar conta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.875rem', color: 'var(--text-muted)' }}>
              Já tem conta?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
