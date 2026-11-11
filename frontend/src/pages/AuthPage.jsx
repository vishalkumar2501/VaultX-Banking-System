import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User
} from 'lucide-react'
import { extractErrorMessage } from '../api/client'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'

export function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isRegister && form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        })
      } else {
        await login({
          email: form.email.trim(),
          password: form.password
        })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(extractErrorMessage(err, 'Authentication failed. Check your details.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-split">
      {/* Left Banking Brand Showcase (Visible on Desktop > 820px) */}
      <div
        className="auth-showcase-panel"
        style={{
          padding: '32px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-solid)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <Link to="/">
            <BrandLogo size={34} showTagline />
          </Link>
          <ThemeToggle />
        </div>

        <div style={{ maxWidth: '470px', margin: '24px 0', zIndex: 1 }}>
          <span className="pill pill-success" style={{ marginBottom: '14px' }}>
            <ShieldCheck size={14} />
            <span>ACID Sessions • Double-Entry Audit Trail</span>
          </span>

          <h2
            className="font-display"
            style={{ fontSize: '2.05rem', fontWeight: 800, lineHeight: 1.14, marginBottom: '12px' }}
          >
            Institutional-grade ledger precision.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '26px' }}>
            Every transfer atomically records balanced debit and credit entries with zero race conditions
            and full idempotency protection.
          </p>

          {/* Overlapping Dual Card + Live Atomic Settlement Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <VirtualBankCard
              account={{ _id: '6740a8b1c9e4f2001a94b101', status: 'ACTIVE', currency: 'INR', balance: 148500 }}
              ownerName="VaultX Member"
              variantIndex={0}
              compact
            />

            <div className="surface-card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  LIVE DOUBLE-ENTRY SETTLEMENT
                </span>
                <span className="pill pill-success" style={{ fontSize: '0.68rem' }}>
                  COMMITTED
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="surface-elevated" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowUpRight size={15} style={{ color: 'var(--status-danger)' }} />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DEBIT ••••B101</div>
                    <div className="font-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--status-danger)' }}>
                      −₹12,500.00
                    </div>
                  </div>
                </div>
                <div className="surface-elevated" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowDownLeft size={15} style={{ color: 'var(--status-success)' }} />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CREDIT ••••D804</div>
                    <div className="font-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--status-success)' }}>
                      +₹12,500.00
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', zIndex: 1 }}>
          <Lock size={14} />
          <span>Protected by httpOnly JWT cookies, TTL token blacklisting &amp; bcrypt salted hashing</span>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div
        style={{
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ width: '100%', maxWidth: '430px' }}>
          {/* Mobile-only Header (Hidden on Desktop so ThemeToggle NEVER duplicates!) */}
          <div className="auth-mobile-header">
            <Link to="/">
              <BrandLogo size={30} />
            </Link>
            <ThemeToggle />
          </div>

          <div className="surface-card animate-in" style={{ padding: '34px 30px' }}>
            <div style={{ marginBottom: '22px' }}>
              <span className="pill pill-neutral" style={{ marginBottom: '12px', fontSize: '0.72rem' }}>
                {isRegister ? 'NEW ACCOUNT ONBOARDING' : 'SECURE CLIENT PORTAL'}
              </span>
              <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '6px' }}>
                {isRegister ? 'Create your VaultX ID' : 'Sign in to VaultX'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {isRegister
                  ? 'Open multi-currency ledger accounts in seconds.'
                  : 'Access your accounts, cards, and audit passbook.'}
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '18px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegister && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Full Name
                  </label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon-left" />
                    <input
                      id="name"
                      type="text"
                      required
                      className="form-input form-input--icon"
                      placeholder="Vishal Kumar"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon-left" />
                  <input
                    id="email"
                    type="email"
                    required
                    className="form-input form-input--icon"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon-left" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="form-input form-input--icon"
                    style={{ paddingRight: '42px' }}
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ marginTop: '6px', width: '100%', padding: '13px 20px' }}
              >
                <span>
                  {submitting
                    ? isRegister
                      ? 'Creating Identity...'
                      : 'Verifying Credentials...'
                    : isRegister
                      ? 'Open Free Account'
                      : 'Sign In'}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {isRegister ? (
                <>
                  Already have a VaultX ID?{' '}
                  <Link to="/login" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  New to VaultX?{' '}
                  <Link to="/register" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                    Open Free Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
