import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Lock, ShieldCheck } from 'lucide-react'
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
      {/* Left Banking Brand Showcase */}
      <div
        className="auth-showcase-panel"
        style={{
          padding: '36px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/">
            <BrandLogo size={34} showTagline />
          </Link>
          <ThemeToggle />
        </div>

        <div style={{ maxWidth: '440px', margin: '36px 0' }}>
          <span className="pill pill-success" style={{ marginBottom: '14px' }}>
            <ShieldCheck size={14} />
            <span>256-Bit Encrypted &amp; JWT Blacklist Secured</span>
          </span>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px' }}>
            Banking precision for every transaction.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Access your accounts, verify real-time balances derived from our immutable ledger,
            and transfer funds atomically.
          </p>

          <VirtualBankCard
            account={{ _id: '6740a8b1c9e4f2001a94b101', status: 'ACTIVE', currency: 'INR', balance: 85400 }}
            ownerName="VaultX Member"
            variantIndex={2}
            compact
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Lock size={14} />
          <span>Protected by httpOnly cookies &amp; bcrypt salted password hashing</span>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div
        style={{
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
            <Link to="/">
              <BrandLogo size={28} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ThemeToggle />
            </div>
          </div>

          <div className="surface-card" style={{ padding: '30px' }}>
            <h1 className="font-display" style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '6px' }}>
              {isRegister ? 'Open your VaultX account' : 'Welcome back'}
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
              {isRegister
                ? 'Start banking with double-entry ledger protection.'
                : 'Sign in to manage accounts and transfer funds.'}
            </p>

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
                  <input
                    id="name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Vishal Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '6px', width: '100%' }}>
                <span>
                  {submitting
                    ? isRegister
                      ? 'Creating Account...'
                      : 'Signing In...'
                    : isRegister
                      ? 'Create Account'
                      : 'Sign In'}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  New to VaultX?{' '}
                  <Link to="/register" style={{ color: 'var(--status-success)', fontWeight: 600 }}>
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
