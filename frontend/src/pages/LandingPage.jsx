import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'

const PREVIEW_ACCOUNTS = [
  { _id: '6740a8b1c9e4f2001a94b101', status: 'ACTIVE', currency: 'INR', balance: 148750 },
  { _id: '6740a8b1c9e4f2001a94d804', status: 'ACTIVE', currency: 'USD', balance: 2400 },
  { _id: '6740a8b1c9e4f2001a94f912', status: 'ACTIVE', currency: 'EUR', balance: 1850 }
]

export function LandingPage() {
  const { user } = useAuth()
  const [featureTab, setFeatureTab] = useState('banking')
  const [selectedCardIdx, setSelectedCardIdx] = useState(0)

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="landing-nav">
        <Link to="/">
          <BrandLogo size={36} showTagline />
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

      <section className="landing-hero">
        <div className="animate-in">
          <span className="pill pill-success" style={{ marginBottom: '18px', fontSize: '0.72rem', letterSpacing: '0.07em' }}>
            YOUR MONEY. OUR VAULT.
          </span>

          <h1 className="font-display" style={{ fontSize: 'clamp(2.2rem, 4.3vw, 3.45rem)', fontWeight: 800, lineHeight: 1.08, marginBottom: '18px' }}>
            Intelligent banking built on an{' '}
            <span style={{ color: 'var(--status-success)' }}>immutable ledger.</span>
          </h1>

          <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '530px', marginBottom: '26px' }}>
            Issue multi-currency vaults, freeze smart cards instantaneously, and execute atomic
            transfers backed by ACID MongoDB transactions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
            {[
              { icon: Lock, text: 'Append-only immutable ledger protected by database pre-hooks' },
              { icon: KeyRound, text: 'Idempotency key shield eliminating duplicate charges' },
              { icon: Zap, text: 'Real-time derived balances from paired DEBIT & CREDIT entries' }
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="icon-tile" style={{ width: '34px', height: '34px', borderRadius: '9px' }}>
                    <Icon size={16} />
                  </span>
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {item.text}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary">
              <span>{user ? 'Go to VaultX Portal' : "Get started — it's free"}</span>
              <ArrowRight size={17} />
            </Link>
            <Link to={user ? '/ledger' : '/login'} className="btn btn-secondary">
              {user ? 'Inspect Audit Ledger' : 'Sign In to Portal'}
            </Link>
          </div>
        </div>

        <div className="animate-in">
          <div className="surface-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22e58a' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  VaultX Command Preview
                </span>
              </div>
              <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>
                <span className="live-dot" />
                <span>Live Engine</span>
              </span>
            </div>

            <div className="surface-elevated" style={{ padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Portfolio Balance</div>
              <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
                ₹1,48,750.00
              </div>
              <svg viewBox="0 0 260 60" style={{ width: '100%', height: '60px', display: 'block' }}>
                <defs>
                  <linearGradient id="heroCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-fill-start)" />
                    <stop offset="100%" stopColor="var(--chart-fill-end)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 4 50 C 40 46, 52 22, 86 28 C 120 34, 134 10, 168 18 C 202 26, 222 12, 256 6 L 256 58 L 4 58 Z"
                  fill="url(#heroCurveFill)"
                />
                <path
                  d="M 4 50 C 40 46, 52 22, 86 28 C 120 34, 134 10, 168 18 C 202 26, 222 12, 256 6"
                  fill="none"
                  stroke="var(--chart-stroke)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Multi-Currency Smart Cards
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['INR Obsidian', 'USD Pearl', 'EUR Navy'].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedCardIdx(idx)}
                    className={`btn btn-sm ${selectedCardIdx === idx ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <VirtualBankCard
              account={PREVIEW_ACCOUNTS[selectedCardIdx]}
              ownerName="Vishal Kumar"
              variantIndex={selectedCardIdx}
              compact
            />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1260px', margin: '0 auto', padding: '8px 24px 72px' }}>
        <div className="surface-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--status-success)', letterSpacing: '0.08em' }}>
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px' }}>
                Built like real banking infrastructure
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${featureTab === 'banking' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFeatureTab('banking')}
              >
                Banking Experience
              </button>
              <button
                type="button"
                className={`btn btn-sm ${featureTab === 'architecture' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFeatureTab('architecture')}
              >
                Backend Security
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {(featureTab === 'banking'
              ? [
                  { icon: Zap, title: 'Instant P2P & Multi-Currency', desc: 'Open INR, USD, EUR, or GBP accounts and transfer funds via verified recipient lookup.' },
                  { icon: ShieldCheck, title: '1-Click Card Freeze Control', desc: 'Freeze or reactivate any smart card instantly; frozen accounts reject all transfers.' },
                  { icon: RefreshCw, title: 'Real-Time Derived Balances', desc: 'Balances aggregate directly from verified ledger credits and debits — zero drift.' }
                ]
              : [
                  { icon: Database, title: 'MongoDB ACID Sessions', desc: 'Paired DEBIT & CREDIT ledger insertions execute atomically with automatic rollback.' },
                  { icon: Lock, title: 'Immutable Pre-Hooks & IDOR Guard', desc: 'Schema hooks block ledger updates/deletes; transfers verify strict req.user._id ownership.' },
                  { icon: CheckCircle2, title: 'JWT Blacklist & Idempotency', desc: 'TTL token revocation on logout plus unique idempotency keys preventing double charges.' }
                ]
            ).map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="surface-elevated" style={{ padding: '20px' }}>
                  <div className="icon-tile" style={{ marginBottom: '12px' }}>
                    <Icon size={19} />
                  </div>
                  <h3 className="font-display" style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {card.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
