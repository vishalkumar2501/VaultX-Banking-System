import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Wallet
} from 'lucide-react'
import { accountApi, healthApi, transactionApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'

export function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [engineOnline, setEngineOnline] = useState(true)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ accounts: [], transactions: [] })
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    let active = true
    healthApi
      .check()
      .then((res) => active && setEngineOnline(res?.database === 'connected'))
      .catch(() => active && setEngineOnline(false))

    transactionApi
      .getHistory({ limit: 4 })
      .then((res) => active && setNotifications(res?.transactions || []))
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  // Ctrl + K global search shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowSearchModal((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false)
        setShowNotifications(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!showSearchModal) return
    Promise.all([accountApi.getAccounts(), transactionApi.getHistory({ limit: 15 })])
      .then(([accRes, txRes]) => {
        setSearchResults({
          accounts: accRes.accounts || [],
          transactions: txRes.transactions || []
        })
      })
      .catch(() => {})
  }, [showSearchModal])

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/transfer', label: 'Send Money', icon: ArrowLeftRight },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/ledger', label: 'Ledger', icon: BookOpen },
    { to: '/cards', label: 'Cards', icon: CreditCard }
  ]

  if (user?.isSystemUser) {
    navItems.push({ to: '/treasury', label: 'Treasury', icon: Landmark, badge: 'System' })
  }

  navItems.push(
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/support', label: 'Help & Support', icon: HelpCircle }
  )

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

  const q = searchQuery.trim().toLowerCase()
  const filteredPages = navItems.filter((item) => item.label.toLowerCase().includes(q))
  const filteredAccounts = searchResults.accounts.filter(
    (a) => a._id.toLowerCase().includes(q) || a.currency.toLowerCase().includes(q)
  )

  return (
    <div className="app-shell">
      {/* Left Sidebar (Matching Uploaded Screenshot) */}
      <aside className="app-sidebar">
        <div>
          <div style={{ padding: '4px 8px' }}>
            <NavLink to="/dashboard">
              <BrandLogo size={36} showTagline />
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '11px' }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="pill pill-success" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '13px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldCheck size={20} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-success)' }}>
                Banking Secure
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {engineOnline ? 'All systems operational' : 'Connecting to engine...'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Utility Bar */}
        <header className="app-topbar">
          {/* Search Trigger (Ctrl + K) */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            style={{
              flex: 1,
              maxWidth: '430px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 14px',
              borderRadius: '11px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Search size={15} />
            <span>Search transactions, accounts... (Ctrl + K)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Notifications"
              style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '17px',
                    height: '17px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="surface-card"
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '300px',
                  padding: '14px',
                  zIndex: 50
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '10px' }}>
                  Recent Activity Alerts
                </div>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No recent alerts.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map((tx) => (
                      <div key={tx._id} className="surface-elevated" style={{ padding: '8px 10px', fontSize: '0.77rem' }}>
                        <div style={{ fontWeight: 600 }}>Settlement: {formatCurrency(tx.amount)}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{formatDateTime(tx.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Profile Pill */}
            <NavLink
              to="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 5px',
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
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                  {user?.isSystemUser ? 'System Admin' : 'Customer'}
                </span>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="app-content animate-in">{children}</main>
      </div>

      {/* Ctrl+K Search Palette Modal */}
      {showSearchModal && (
        <div className="modal-backdrop" onClick={() => setShowSearchModal(false)}>
          <div className="surface-card modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Search size={17} style={{ color: 'var(--status-success)' }} />
              <input
                type="text"
                autoFocus
                className="form-input"
                placeholder="Jump to page, currency, or account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
              {filteredPages.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.to}
                    type="button"
                    className="surface-elevated"
                    style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', textAlign: 'left' }}
                    onClick={() => {
                      setShowSearchModal(false)
                      navigate(p.to)
                    }}
                  >
                    <Icon size={15} style={{ color: 'var(--status-success)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{p.label}</span>
                  </button>
                )
              })}

              {filteredAccounts.map((acc) => (
                <button
                  key={acc._id}
                  type="button"
                  className="surface-elevated"
                  style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}
                  onClick={() => {
                    setShowSearchModal(false)
                    navigate(`/ledger?accountId=${acc._id}`)
                  }}
                >
                  <span className="font-mono" style={{ fontSize: '0.8rem' }}>
                    {acc.currency} ••••{acc._id.slice(-4)}
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--status-success)' }}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
