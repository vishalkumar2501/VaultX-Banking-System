import { Lock, ShieldCheck, User } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatShortDate } from '../utils/formatters'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()

  return (
    <AppLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          Account Settings &amp; Security
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Manage your profile identity, visual theme, and session security posture.
        </p>
      </div>

      <div className="dashboard-split" style={{ marginTop: 0 }}>
        <div className="surface-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-tile">
              <User size={19} />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Customer Identity
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Verified from MongoDB User Ledger
              </p>
            </div>
          </div>

          <div className="surface-elevated" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Full Name</span>
              <strong>{user?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Role</span>
              <span className="pill pill-success">{user?.isSystemUser ? 'System Admin' : 'Customer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Member Since</span>
              <span>{formatShortDate(user?.createdAt)}</span>
            </div>
          </div>

          <div className="surface-elevated" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Interface Theme</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Current mode: {theme === 'dark' ? 'Cyber Emerald Dark' : 'Daylight Mist Light'}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="surface-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-tile">
              <ShieldCheck size={19} />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Active Security Protections
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Server-side guarantees protecting your funds
              </p>
            </div>
          </div>

          {[
            'Bcrypt password hashing (10 salt rounds) with select: false protection',
            'httpOnly & SameSite JWT session cookies with 3-day TTL Token Blacklisting',
            'MongoDB ACID multi-document sessions with automatic rollback on errors',
            'Strict server-side IDOR ownership enforcement on every account transfer',
            'Immutable append-only ledger protected by 8 database pre-hooks'
          ].map((rule) => (
            <div key={rule} className="surface-elevated" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
              <Lock size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              <span>{rule}</span>
            </div>
          ))}

          <button type="button" onClick={logout} className="btn btn-secondary" style={{ marginTop: '6px' }}>
            Invalidate Session &amp; Logout
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
