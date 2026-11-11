import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, Plus, ShieldAlert, ShieldCheck } from 'lucide-react'
import { accountApi, extractErrorMessage } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'

export function CardsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadCards = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await accountApi.getAccounts()
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load virtual cards.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const handleToggleStatus = async (accountId, nextStatus) => {
    setTogglingId(accountId)
    setError('')
    setMessage('')
    try {
      const data = await accountApi.updateStatus(accountId, nextStatus)
      setAccounts((prev) => prev.map((acc) => (acc._id === accountId ? data.account : acc)))
      setMessage(
        nextStatus === 'FROZEN'
          ? `Card ••••${accountId.slice(-4)} frozen. All outgoing & incoming transfers are now blocked.`
          : `Card ••••${accountId.slice(-4)} reactivated and ready for transfers.`
      )
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to update card status.'))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Smart Cards Control Center
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Freeze, unfreeze, inspect and copy credentials for your VaultX virtual cards.
          </p>
        </div>
        <Link to="/accounts" className="btn btn-primary btn-sm">
          <Plus size={15} />
          <span>Issue New Card</span>
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
        <div className="surface-card" style={{ padding: '30px', color: 'var(--text-secondary)' }}>
          Loading smart cards...
        </div>
      ) : accounts.length === 0 ? (
        <div className="surface-card" style={{ padding: '36px', textAlign: 'center' }}>
          <CreditCard size={32} style={{ color: 'var(--status-success)', marginBottom: '10px' }} />
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
            No Virtual Cards Issued Yet
          </h3>
          <Link to="/accounts" className="btn btn-primary btn-sm">
            Open Your First Account &amp; Card
          </Link>
        </div>
      ) : (
        <div className="cards-grid">
          {accounts.map((acc, idx) => {
            const isActive = acc.status === 'ACTIVE'
            return (
              <div key={acc._id} className="surface-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <VirtualBankCard
                  account={acc}
                  ownerName={user?.name}
                  variantIndex={idx}
                  onToggleStatus={handleToggleStatus}
                  toggling={togglingId === acc._id}
                />

                <div className="surface-elevated" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {isActive ? (
                      <ShieldCheck size={16} style={{ color: 'var(--status-success)' }} />
                    ) : (
                      <ShieldAlert size={16} style={{ color: 'var(--status-danger)' }} />
                    )}
                    <span>{isActive ? 'Transfers Enabled' : 'Card Frozen (Blocked)'}</span>
                  </div>

                  <button
                    type="button"
                    disabled={togglingId === acc._id}
                    onClick={() => handleToggleStatus(acc._id, isActive ? 'FROZEN' : 'ACTIVE')}
                    className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {togglingId === acc._id ? 'Updating...' : isActive ? 'Freeze Card' : 'Unfreeze'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
