import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, RefreshCw } from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export function LedgerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLedger = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accRes, ledgerRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getLedger(selectedAccountId ? { accountId: selectedAccountId } : {})
      ])
      setAccounts(accRes.accounts || [])
      setEntries(ledgerRes.entries || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load immutable ledger.'))
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  const handleFilter = (val) => {
    setSelectedAccountId(val)
    if (val) setSearchParams({ accountId: val })
    else setSearchParams({})
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Immutable Double-Entry Ledger
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Append-only audit trail protected against modification by Mongoose pre-hooks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '200px', padding: '8px 12px', fontSize: '0.84rem' }}
            value={selectedAccountId}
            onChange={(e) => handleFilter(e.target.value)}
          >
            <option value="">All Accounts ({accounts.length})</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.currency} ••••{acc._id.slice(-4)} ({formatCurrency(acc.balance, acc.currency)})
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadLedger} disabled={loading}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      <div className="surface-card" style={{ padding: '22px' }}>
        <div className="surface-elevated" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          <Lock size={16} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
          <span>
            <strong>Cryptographic-Grade Auditability:</strong> Every money transfer inserts paired <code>DEBIT</code> and <code>CREDIT</code> ledger documents inside a MongoDB ACID session.
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading ledger rows...</p>
        ) : entries.length === 0 ? (
          <div className="surface-elevated" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No ledger entries recorded yet.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ledger Entry ID</th>
                  <th>Account</th>
                  <th>Entry Type</th>
                  <th>Transaction Ref</th>
                  <th>Settled At</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isCredit = entry.type === 'CREDIT'
                  const accId = entry.account?._id || entry.account
                  const txId = entry.transaction?._id || entry.transaction
                  return (
                    <tr key={entry._id}>
                      <td className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {String(entry._id).slice(-12)}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.82rem' }}>
                        ••••{String(accId).slice(-6)}
                      </td>
                      <td>
                        <span className={`pill ${isCredit ? 'pill-success' : 'pill-danger'}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {String(txId).slice(-12)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {formatDateTime(entry.transaction?.createdAt)}
                      </td>
                      <td
                        className="font-mono"
                        style={{ textAlign: 'right', fontWeight: 700, color: isCredit ? 'var(--status-success)' : 'var(--status-danger)' }}
                      >
                        {isCredit ? '+' : '−'}
                        {formatCurrency(entry.amount, entry.account?.currency || 'INR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
