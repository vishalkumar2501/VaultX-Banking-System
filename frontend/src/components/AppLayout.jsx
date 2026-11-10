import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  BookOpenCheck,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  ShieldCheck
} from 'lucide-react'
import { healthApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'

export function AppLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [engineOnline, setEngineOnline] = useState(true)

  useEffect(() => {
    let active = true
    healthApi
      .check()
      .then((res) => {
        if (active) setEngineOnline(res?.database === 'connected')
      })
      .catch(() => {
        if (active) setEngineOnline(false)
      })
    return () => {
      active = false
    }
  }, [])

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/accounts', label: 'Accounts & Cards', icon: CreditCard },
    { to: '/transfer', label: 'Send Money', icon: ArrowLeftRight },
    { to: '/ledger', label: 'Passbook & Ledger', icon: BookOpenCheck }
  ]

  if (user?.isSystemUser) {
    navItems.push({ to: '/treasury', label: 'System Treasury', icon: Landmark })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <div>
          <div style={{ padding: '4px 8px' }}>
            <NavLink to="/dashboard">
              <BrandLogo showTagline />
            </NavLink>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="surface-elevated" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={15} style={{ color: 'var(--status-success)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>ACID Ledger Active</span>
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Double-entry &amp; idempotent settlement secured by MongoDB sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        <header className="app-topbar">
          <div>
            <h1 className="font-display" style={{ fontSize: '1.12rem', fontWeight: 700 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{subtitle}</p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              className="pill pill-neutral"
              style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
              title="Live MongoDB Ledger Health"
            >
              <span
                className="live-dot"
                style={{ background: engineOnline ? 'var(--status-success)' : 'var(--status-warning)' }}
              />
              <span>{engineOnline ? 'Engine Live' : 'Reconnecting'}</span>
            </span>

            <ThemeToggle />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 10px 5px 5px',
                borderRadius: '999px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  color: 'var(--accent-primary-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.78rem'
                }}
              >
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {user?.isSystemUser ? 'System Admin' : 'Personal Banking'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content animate-in">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
