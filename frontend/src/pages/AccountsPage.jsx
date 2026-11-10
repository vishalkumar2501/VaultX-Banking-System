import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, CheckCircle2, Plus, RefreshCw } from 'lucide-react'
import { accountApi, extractErrorMessage } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'
import { formatShortDate } from '../utils/formatters'

export function AccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [refreshingId, setRefreshingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await accountApi.getAccounts()
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load accounts.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleCreateAccount = async () => {
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const data = await accountApi.createAccount()
      setAccounts((prev) => [data.account, ...prev])
      setMessage(`New ${data.account.currency} account opened successfully!`)
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to create account.'))
    } finally {
      setCreating(false)
    }
  }

  const handleRefreshBalance = async (accountId) => {
    setRefreshingId(accountId)
    setError('')
    try {
      const data = await accountApi.getBalance(accountId)
      setAccounts((prev) =>
        prev.map((acc) => (acc._id === accountId ? { ...acc, balance: data.balance } : acc))
      )
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <AppLayout
      title="Accounts & Virtual Cards"
      subtitle="Manage your banking accounts, inspect live ledger balances, and copy IDs"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '22px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={handleCreateAccount} disabled={creating}>
            <Plus size={16} />
            <span>{creating ? 'Opening Account...' : 'Open New Account'}</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={loadAccounts} disabled={loading}>
            <RefreshCw size={15} />
            <span>Sync All Balances</span>
          </button>
        </div>

        <Link to="/transfer" className="btn btn-secondary">
          <ArrowLeftRight size={15} />
          <span>Transfer Between Accounts</span>
        </Link>
      </div>

      {message && (
        <div className="alert alert-success" style={{ marginBottom: '18px' }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '18px' }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="surface-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your accounts from VaultX Ledger...
        </div>
      ) : accounts.length === 0 ? (
        <div className="surface-card" style={{ padding: '42px', textAlign: 'center' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            No Banking Accounts Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Open your first INR account to generate your virtual banking card and receive deposits.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleCreateAccount} disabled={creating}>
            <Plus size={16} />
            <span>Open Your First Account</span>
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {accounts.map((acc, idx) => (
            <div key={acc._id} className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <VirtualBankCard
                account={acc}
                ownerName={user?.name}
                variantIndex={idx}
                onRefreshBalance={handleRefreshBalance}
                refreshing={refreshingId === acc._id}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>Opened {formatShortDate(acc.createdAt)}</span>
                <Link to={`/ledger?accountId=${acc._id}`} style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                  View Statement →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
