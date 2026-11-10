import { useState } from 'react'
import { AlertCircle, CheckCircle2, Landmark, Search } from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { formatCurrency } from '../utils/formatters'

function generateKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sys-${crypto.randomUUID()}`
  }
  return `sys-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function TreasuryPage() {
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [lookupQuery, setLookupQuery] = useState('')
  const [results, setResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!lookupQuery.trim()) return
    setError('')
    try {
      const data = await accountApi.lookup(lookupQuery.trim())
      setResults(data.accounts || [])
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleMint = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    const numericAmount = Number(amount)
    if (!toAccount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Valid destination Account ID and positive amount are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await transactionApi.mintInitialFunds({
        toAccount: toAccount.trim(),
        amount: numericAmount,
        idempotencyKey: generateKey()
      })
      setSuccessMsg(
        `Credited ${formatCurrency(res.transaction.amount)} to account ••••${toAccount.slice(-4)}.`
      )
      setAmount('')
    } catch (err) {
      setError(extractErrorMessage(err, 'Treasury funding failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout
      title="System Treasury"
      subtitle="Authorized initial liquidity disbursement from Bank System Account"
    >
      <div className="dashboard-split" style={{ marginTop: 0 }}>
        <div className="surface-card" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Landmark size={20} style={{ color: 'var(--status-success)' }} />
            <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Disburse Initial Funds
            </h2>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="treasuryTo">
                Target Customer Account ID
              </label>
              <input
                id="treasuryTo"
                type="text"
                required
                className="form-input font-mono"
                placeholder="24-char MongoDB Account ID"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="treasuryAmount">
                Amount (INR)
              </label>
              <input
                id="treasuryAmount"
                type="number"
                min="1"
                step="0.01"
                required
                className="form-input font-mono"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Disbursing...' : 'Authorize & Credit Funds'}
            </button>
          </form>
        </div>

        <div className="surface-card" style={{ padding: '24px' }}>
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px' }}>
            Search Customer Account
          </h3>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Customer email or Account ID"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">
              <Search size={16} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((acc) => (
              <button
                key={acc._id}
                type="button"
                className="surface-elevated"
                style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setToAccount(acc._id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{acc.owner?.name}</div>
                  <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {acc.owner?.email} • ••••{acc._id.slice(-4)}
                  </div>
                </div>
                <span className="pill pill-success">Select</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
