import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Lock, RefreshCw } from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export function LedgerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('passbook')
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '')

  const [transactions, setTransactions] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const limit = 15

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (selectedAccountId) params.accountId = selectedAccountId

      const [accRes, txRes, ledgerRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getHistory(params),
        transactionApi.getLedger(selectedAccountId ? { accountId: selectedAccountId } : {})
      ])

      setAccounts(accRes.accounts || [])
      setTransactions(txRes.transactions || [])
      setTotal(txRes.pagination?.total ?? 0)
      setLedgerEntries(ledgerRes.entries || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load passbook & ledger.'))
    } finally {
      setLoading(false)
    }
  }, [page, selectedAccountId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const handleAccountFilterChange = (val) => {
    setSelectedAccountId(val)
    setPage(1)
    if (val) setSearchParams({ accountId: val })
    else setSearchParams({})
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <AppLayout
      title="Passbook & Audit Ledger"
      subtitle="Transparent transaction history & immutable double-entry records"
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '18px' }}>
          <span>{error}</span>
        </div>
      )}

      <div className="surface-card" style={{ padding: '24px' }}>
        {/* Header Bar with Minimalist Underline Tabs & Account Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div className="underline-tabs">
            <button
              type="button"
              className={`underline-tab ${activeTab === 'passbook' ? 'active' : ''}`}
              onClick={() => setActiveTab('passbook')}
            >
              Transactions Passbook
            </button>
            <button
              type="button"
              className={`underline-tab ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              Immutable Double-Entry Ledger
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '210px', padding: '8px 12px', fontSize: '0.84rem' }}
              value={selectedAccountId}
              onChange={(e) => handleAccountFilterChange(e.target.value)}
            >
              <option value="">All Accounts ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.currency} ••••{acc._id.slice(-4)} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>

            <button type="button" className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {activeTab === 'passbook' ? (
          <>
            {loading ? (
              <p style={{ padding: '24px 0', color: 'var(--text-secondary)' }}>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="surface-elevated" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No transactions found for the selected filter.
              </div>
            ) : (
              <>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Counterparty</th>
                        <th>Type</th>
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

                        const counterpartyObj = isCredit ? tx.fromAccount?.user : tx.toAccount?.user
                        const counterpartyTitle = isInternal
                          ? 'Internal Transfer'
                          : counterpartyObj?.name || 'System / External'

                        return (
                          <tr key={tx._id}>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                              {formatDateTime(tx.createdAt)}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{counterpartyTitle}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {counterpartyObj?.email || (isCredit ? `From ••••${String(fromId).slice(-4)}` : `To ••••${String(toId).slice(-4)}`)}
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
                            <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {tx.idempotencyKey?.slice(0, 18)}
                              {tx.idempotencyKey?.length > 18 ? '…' : ''}
                            </td>
                            <td
                              className="font-mono"
                              style={{
                                textAlign: 'right',
                                fontWeight: 700,
                                color: isCredit
                                  ? 'var(--status-success)'
                                  : isInternal
                                    ? 'var(--text-primary)'
                                    : 'var(--status-danger)'
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

                {/* Pagination */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '18px',
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span>
                    Page {page} of {totalPages} ({total} records)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div
              className="surface-elevated"
              style={{
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.83rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Lock size={16} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              <span>
                <strong>Append-Only Immutable Audit Log:</strong> These raw DEBIT and CREDIT records are protected
                by Mongoose pre-hooks and cannot be updated or deleted.
              </span>
            </div>

            {loading ? (
              <p style={{ padding: '24px 0', color: 'var(--text-secondary)' }}>Loading ledger entries...</p>
            ) : ledgerEntries.length === 0 ? (
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
                    {ledgerEntries.map((entry) => {
                      const isCredit = entry.type === 'CREDIT'
                      const accId = entry.account?._id || entry.account
                      const txId = entry.transaction?._id || entry.transaction
                      return (
                        <tr key={entry._id}>
                          <td className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {String(entry._id).slice(-10)}
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
                            {String(txId).slice(-10)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {formatDateTime(entry.transaction?.createdAt)}
                          </td>
                          <td
                            className="font-mono"
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isCredit ? 'var(--status-success)' : 'var(--status-danger)'
                            }}
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
          </>
        )}
      </div>
    </AppLayout>
  )
}
