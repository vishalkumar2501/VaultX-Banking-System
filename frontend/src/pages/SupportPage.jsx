import { useEffect, useState } from 'react'
import { CheckCircle2, HelpCircle, Server } from 'lucide-react'
import { healthApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'

export function SupportPage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    healthApi.check().then(setHealth).catch(() => setHealth({ status: 'error', database: 'disconnected' }))
  }, [])

  const faqs = [
    {
      q: 'Why does my new VaultX account start with ₹0?',
      a: 'VaultX follows strict double-entry accounting. Funds cannot appear out of thin air — they enter customer accounts through System Treasury disbursements or peer-to-peer transfers.'
    },
    {
      q: 'What happens when I Freeze a card/account?',
      a: 'Freezing changes your account status to FROZEN via PATCH /api/accounts/:id/status. The backend automatically blocks all transfers involving frozen accounts.'
    },
    {
      q: 'How does the Idempotency Key protect me?',
      a: 'Every transfer request sends a unique UUID key. If the network drops and the request retries twice, VaultX processes the debit/credit pair strictly once.'
    },
    {
      q: 'Can historic ledger entries ever be edited or deleted?',
      a: 'No. Mongoose pre-hooks in ledger.model.js explicitly reject updateOne, findOneAndUpdate, and delete operations so your audit history stays 100% tamper-proof.'
    }
  ]

  return (
    <AppLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          Help, Diagnostics &amp; Support
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Live backend health status and core banking architecture guide.
        </p>
      </div>

      <div className="surface-card" style={{ padding: '20px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="icon-tile">
            <Server size={19} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {health?.service || 'VaultX Core Engine'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Database Status: <strong>{health?.database || 'Checking...'}</strong>
            </div>
          </div>
        </div>
        <span className={`pill ${health?.database === 'connected' ? 'pill-success' : 'pill-warning'}`}>
          <CheckCircle2 size={13} />
          <span>{health?.database === 'connected' ? 'All Systems Operational' : 'Checking Connection'}</span>
        </span>
      </div>

      <div className="surface-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HelpCircle size={18} style={{ color: 'var(--status-success)' }} />
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
        </div>

        {faqs.map((item) => (
          <div key={item.q} className="surface-elevated" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>{item.q}</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
