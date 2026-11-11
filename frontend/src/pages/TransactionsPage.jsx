import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '')
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const limit = 15

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (selectedAccountId) params.accountId = selectedAccountId

      const [accRes, txRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getHistory(params)
      ])
      setAccounts(accRes.accounts || [])
      setTransactions(txRes.transactions || [])
      setTotal(txRes.pagination?.total ?? 0)
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load transactions.'))
    } finally {
      setLoading(false)
    }
  }, [page, selectedAccountId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleFilter = (val) => {
    setSelectedAccountId(val)
    setPage(1)
    if (val) setSearchParams({ accountId: val })
    else setSearchParams({})
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Transactions Passbook
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Complete record of settled transfers, inflows, and idempotency keys.
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

          <button type="button" className="btn btn-secondary btn-sm" onClick={loadHistory} disabled={loading}>
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
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading passbook...</p>
        ) : transactions.length === 0 ? (
          <div className="surface-elevated" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found.
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Counterparty</th>
                    <th>Direction</th>
                    <th>Status</th>
                    <th>Idempotency Key</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const fromId = tx.fromAccount?._id || tx.fromAccount
                    const toId = tx.toAccount?._id || tx.toAccount
                    const isFromMine = selectedAccountId ? fromId === selectedAccountId : userAccountIds.has(fromId)
                    const isToMine = selectedAccountId ? toId === selectedAccountId : userAccountIds.has(toId)
                    const isInternal = !selectedAccountId && isFromMine && isToMine
                    const isCredit = !isFromMine && isToMine
                    const peer = isCredit ? tx.fromAccount?.user : tx.toAccount?.user

                    return (
                      <tr key={tx._id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{isInternal ? 'Internal Vault Transfer' : peer?.name || 'System / External'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {peer?.email || `••••${String(isCredit ? fromId : toId).slice(-4)}`}
                          </div>
                        </td>
                        <td>
                          <span className={`pill ${isCredit ? 'pill-success' : isInternal ? 'pill-neutral' : 'pill-danger'}`}>
                            {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {isInternal ? 'INTERNAL' : isCredit ? 'CREDIT' : 'DEBIT'}
                          </span>
                        </td>
                        <td>
                          <span className={`pill ${tx.status === 'COMPLETED' ? 'pill-success' : 'pill-warning'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {tx.idempotencyKey?.slice(0, 20)}
                          {tx.idempotencyKey?.length > 20 ? '…' : ''}
                        </td>
                        <td
                          className="font-mono"
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isCredit ? 'var(--status-success)' : isInternal ? 'var(--text-primary)' : 'var(--status-danger)'
                          }}
                        >
                          {isCredit ? '+' : isInternal ? '' : '−'}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <span>Page {page} of {totalPages} ({total} total)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
