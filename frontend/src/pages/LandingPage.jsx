import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { _id: '6740a8b1c9e4f2001a94b101', status: 'ACTIVE', currency: 'INR', balance: 148500 },
  { _id: '6740a8b1c9e4f2001a94d804', status: 'ACTIVE', currency: 'USD', balance: 2400 }
]

export function LandingPage() {
  const { user } = useAuth()
  const [featureTab, setFeatureTab] = useState('banking')

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top Navbar */}
      <header className="landing-nav">
        <Link to="/">
          <BrandLogo size={34} showTagline />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              <span>Open Dashboard</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span>Open Account</span>
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section (GoWallet + Vepay Aesthetic) */}
      <section className="landing-hero">
        <div>
          <span
            className="pill pill-success"
            style={{ marginBottom: '18px', fontSize: '0.73rem', letterSpacing: '0.07em' }}
          >
            DOUBLE-ENTRY CORE BANKING ENGINE
          </span>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.15rem, 4.4vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: '18px'
            }}
          >
            Modern banking built on an{' '}
            <span style={{ color: 'var(--status-success)' }}>immutable ledger.</span>
          </h1>

          <p
            style={{
              fontSize: '1.02rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '540px',
              marginBottom: '26px'
            }}
          >
            Manage multi-currency accounts, execute atomic peer-to-peer transfers, and audit
            every rupee through cryptographic-grade double-entry accounting.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {[
              'Immutable Append-Only Ledger — every DEBIT is paired with an exact CREDIT.',
              'ACID MongoDB Transactions — zero partial transfers or race conditions.',
              'Idempotent Retries & Blacklist Auth — enterprise security on every request.'
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary">
              <span>{user ? 'Go to Banking Portal' : "Get started — it's free"}</span>
              <ArrowRight size={17} />
            </Link>
            <Link to={user ? '/ledger' : '/login'} className="btn btn-secondary">
              {user ? 'Inspect Audit Ledger' : 'Sign In to Account'}
            </Link>
          </div>
        </div>

        {/* Visual Cards Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="surface-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Multi-Account Portfolio
                </div>
                <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  Live Card &amp; Balance Stack
                </div>
              </div>
              <span className="pill pill-success">Active</span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <VirtualBankCard
                account={DEMO_ACCOUNTS[0]}
                ownerName="Vishal Kumar"
                variantIndex={0}
                compact
              />
              <VirtualBankCard
                account={DEMO_ACCOUNTS[1]}
                ownerName="Vishal Kumar"
                variantIndex={1}
                compact
              />
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Showcase Section with GoWallet Underline Tabs */}
      <section style={{ maxWidth: '1220px', margin: '0 auto', padding: '12px 24px 72px' }}>
        <div className="surface-card" style={{ padding: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '26px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-success)', letterSpacing: '0.08em' }}>
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '6px' }}>
                Built like real financial infrastructure
              </h2>
            </div>

            <div className="underline-tabs">
              <button
                type="button"
                className={`underline-tab ${featureTab === 'banking' ? 'active' : ''}`}
                onClick={() => setFeatureTab('banking')}
              >
                Banking Experience
              </button>
              <button
                type="button"
                className={`underline-tab ${featureTab === 'architecture' ? 'active' : ''}`}
                onClick={() => setFeatureTab('architecture')}
              >
                Backend Engineering
              </button>
            </div>
          </div>

          {featureTab === 'banking' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {[
                {
                  icon: Zap,
                  title: 'Instant P2P & Internal Transfers',
                  desc: 'Look up recipients by verified email or Account ID and settle transfers in milliseconds.'
                },
                {
                  icon: ShieldCheck,
                  title: 'Protected Account Ownership',
                  desc: 'Strict server-side ownership checks ensure only authorized owners can debit an account.'
                },
                {
                  icon: RefreshCw,
                  title: 'Real-Time Derived Balances',
                  desc: 'Balances aggregate straight from verified ledger credits and debits — zero drift.'
                }
              ].map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.title} className="surface-elevated" style={{ padding: '20px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--accent-soft)',
                        color: 'var(--status-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px'
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display" style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {card.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {[
                {
                  icon: Database,
                  title: 'MongoDB ACID Sessions',
                  desc: 'Paired DEBIT & CREDIT ledger insertions execute inside atomic transactions with full rollback.'
                },
                {
                  icon: Lock,
                  title: 'Immutable Schema Hooks',
                  desc: 'Mongoose pre-hooks explicitly reject all updateOne, findOneAndUpdate, and delete operations on ledgers.'
                },
                {
                  icon: ShieldCheck,
                  title: 'JWT Blacklist & Idempotency',
                  desc: 'TTL-indexed token revocation on logout plus unique idempotency keys preventing double charges.'
                }
              ].map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.title} className="surface-elevated" style={{ padding: '20px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'var(--accent-soft)',
                        color: 'var(--status-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px'
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display" style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {card.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
