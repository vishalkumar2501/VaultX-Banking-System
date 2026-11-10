import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { formatCurrency, formatDateTime } from '../utils/formatters'

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `vx-${crypto.randomUUID()}`
  }
  return `vx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function TransferPage() {
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey)

  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const data = await accountApi.getAccounts()
      const list = data.accounts || []
      setAccounts(list)
      if (list.length > 0 && !fromAccount) {
        setFromAccount(list[0]._id)
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingAccounts(false)
    }
  }, [fromAccount])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const selectedSourceAccount = useMemo(
    () => accounts.find((acc) => acc._id === fromAccount) || null,
    [accounts, fromAccount]
  )

  const otherOwnAccounts = useMemo(
    () => accounts.filter((acc) => acc._id !== fromAccount && acc.status === 'ACTIVE'),
    [accounts, fromAccount]
  )

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!lookupQuery.trim()) return
    setSearching(true)
    setError('')
    try {
      const data = await accountApi.lookup(lookupQuery.trim())
      setLookupResults(data.accounts || [])
      if ((data.accounts || []).length === 0) {
        setError('No active recipient account found for that Email or Account ID.')
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Lookup failed.'))
    } finally {
      setSearching(false)
    }
  }

  const chooseRecipient = (acc) => {
    setToAccount(acc._id)
    setSelectedRecipient(acc)
    setError('')
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setError('')

    if (!fromAccount || !toAccount) {
      setError('Please select both a source account and destination account.')
      return
    }
    if (fromAccount === toAccount) {
      setError('Source and destination accounts cannot be identical.')
      return
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than zero.')
      return
    }

    if (selectedSourceAccount && selectedSourceAccount.balance < numericAmount) {
      setError(
        `Insufficient balance. Available: ${formatCurrency(selectedSourceAccount.balance)}`
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await transactionApi.transfer({
        fromAccount,
        toAccount: toAccount.trim(),
        amount: numericAmount,
        idempotencyKey
      })
      setReceipt(res.transaction)
      setAmount('')
      setIdempotencyKey(generateIdempotencyKey())
      await loadAccounts()
    } catch (err) {
      setError(extractErrorMessage(err, 'Transfer failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout
      title="Send Money"
      subtitle="Atomic double-entry transfers protected by idempotency keys"
    >
      <div className="dashboard-split" style={{ marginTop: 0 }}>
        {/* Transfer Form Card */}
        <div className="surface-card" style={{ padding: '26px' }}>
          <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
            Wire / P2P Transfer
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Funds move atomically inside a MongoDB transaction session.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '18px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="fromAccount">
                From Your Account
              </label>
              <select
                id="fromAccount"
                className="form-input"
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                disabled={loadingAccounts || accounts.length === 0}
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts available</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.currency} ••••{acc._id.slice(-4)} — Balance: {formatCurrency(acc.balance)} ({acc.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="toAccount">
                To Destination Account ID
              </label>
              <input
                id="toAccount"
                type="text"
                required
                className="form-input font-mono"
                placeholder="Paste 24-char Account ID or search on the right"
                value={toAccount}
                onChange={(e) => {
                  setToAccount(e.target.value)
                  setSelectedRecipient(null)
                }}
              />
              {selectedRecipient && (
                <div
                  className="pill pill-success"
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                >
                  <UserCheck size={14} />
                  <span>
                    Verified: {selectedRecipient.owner?.name || 'Internal Account'} ({selectedRecipient.currency})
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount ({selectedSourceAccount?.currency || 'INR'})
              </label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                className="form-input font-mono"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                {[500, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="btn btn-secondary btn-sm font-mono"
                    onClick={() => setAmount(String(preset))}
                  >
                    +₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Idempotency Protection Indicator */}
            <div className="surface-elevated" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                  <KeyRound size={14} style={{ color: 'var(--status-success)' }} />
                  Idempotency Key (Duplicate Shield)
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                  onClick={() => setIdempotencyKey(generateIdempotencyKey())}
                >
                  <RefreshCw size={12} />
                  <span>Regenerate</span>
                </button>
              </div>
              <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {idempotencyKey}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || accounts.length === 0}
              style={{ width: '100%' }}
            >
              <span>{submitting ? 'Executing Atomic Transfer...' : 'Confirm & Send Money'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>

        {/* Right Helper Panel: Recipient Discovery & Internal Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="surface-card" style={{ padding: '24px' }}>
            <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              Find Recipient Account
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Look up an active VaultX recipient by registered email or Account ID.
            </p>

            <form onSubmit={handleLookup} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="recipient@email.com or Account ID"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" disabled={searching}>
                <Search size={16} />
              </button>
            </form>

            {lookupResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {lookupResults.map((acc) => (
                  <button
                    key={acc._id}
                    type="button"
                    onClick={() => chooseRecipient(acc)}
                    className="surface-elevated"
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: toAccount === acc._id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {acc.owner?.name || 'VaultX Account'}
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {acc.owner?.email} • ••••{acc._id.slice(-4)}
                      </div>
                    </div>
                    <span className="pill pill-success">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Self-Transfer Between Own Accounts */}
          {otherOwnAccounts.length > 0 && (
            <div className="surface-card" style={{ padding: '24px' }}>
              <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                Your Other Accounts
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                1-click internal transfer between your VaultX accounts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {otherOwnAccounts.map((acc) => (
                  <button
                    key={acc._id}
                    type="button"
                    onClick={() => chooseRecipient(acc)}
                    className="surface-elevated"
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: toAccount === acc._id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {acc.currency} Account ••••{acc._id.slice(-4)}
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Balance: {formatCurrency(acc.balance)}
                      </div>
                    </div>
                    <span className="pill pill-neutral">Use</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="surface-elevated" style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <ShieldCheck size={18} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Every transfer validates source account ownership on the server, locks balances within an ACID transaction,
              and writes paired immutable DEBIT &amp; CREDIT entries.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement Receipt Modal */}
      {receipt && (
        <div className="modal-backdrop" onClick={() => setReceipt(null)}>
          <div className="surface-card modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                Transfer Settled
              </h3>
              <div className="font-display" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '6px' }}>
                {formatCurrency(receipt.amount)}
              </div>
            </div>

            <div className="surface-elevated" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span className="pill pill-success">{receipt.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
                <span className="font-mono" style={{ wordBreak: 'break-all', textAlign: 'right' }}>{receipt._id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Timestamp</span>
                <span>{formatDateTime(receipt.createdAt)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() => setReceipt(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
