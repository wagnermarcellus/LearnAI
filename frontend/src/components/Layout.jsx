import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/dashboard',      icon: '🏠', label: 'Dashboard'     },
  { to: '/learning-paths', icon: '📚', label: 'Trilhas'        },
  { to: '/study-plan',     icon: '📋', label: 'Plano de Estudo'},
  { to: '/tutor',          icon: '🤖', label: 'Tutor IA'       },
  { to: '/progress',       icon: '📈', label: 'Progresso'      },
]

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 8,
        fontWeight: 500, fontSize: '.9rem',
        color:      isActive ? '#6366f1' : '#64748b',
        background: isActive ? '#e0e7ff' : 'transparent',
        transition: 'all .15s',
        textDecoration: 'none',
      })}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const [open, setOpen]   = useState(true)

  const xp    = user?.xp    || 0
  const level = Math.floor(xp / 100) + 1
  const xpPct = xp % 100

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: open ? 240 : 0, minWidth: open ? 240 : 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'all .2s', overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>🧠</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>LearnAI</span>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '.9rem', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                Nível {level} · {xp} XP
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => <NavItem key={item.to} {...item} />)}

          {user?.role === 'admin' && (
            <>
              <div style={{ margin: '10px 14px 4px', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Admin
              </div>
              <NavItem to="/admin/paths" icon="⚙️" label="Gerenciar Trilhas" />
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary btn-full" onClick={handleLogout}>
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        }}>
          <button
            onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', lineHeight: 1 }}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <span className={`badge ${user?.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
            {user?.role === 'admin' ? '⚙️ Admin' : '🎓 Aluno'}
          </span>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
