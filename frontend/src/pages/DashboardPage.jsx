import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  QrCode,
  Send,
  Wallet
} from 'lucide-react'
import { accountApi, extractErrorMessage, healthApi, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { FinancialOverviewChart } from '../components/FinancialOverviewChart'
import { HeroBankBanner } from '../components/HeroBankBanner'
import { MultiCurrencyDonut } from '../components/MultiCurrencyDonut'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateTime } from '../utils/formatters'

function MiniSparkline({ color = '#22e58a', up = true }) {
  const d = up
    ? 'M2 22 C 16 20, 22 10, 36 14 C 50 18, 56 6, 78 4'
    : 'M2 6 C 18 8, 26 18, 42 13 C 56 8, 66 20, 78 22'
  return (
    <svg width="80" height="26" viewBox="0 0 80 26" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [engineOnline, setEngineOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hideBalance, setHideBalance] = useState(false)

  // Quick Action Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showScanPayModal, setShowScanPayModal] = useState(false)
  const [scanTarget, setScanTarget] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accRes, txRes, healthRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getHistory({ limit: 50 }),
        healthApi.check().catch(() => ({ database: 'disconnected' }))
      ])
      setAccounts(accRes.accounts || [])
      setTransactions(txRes.transactions || [])
      setEngineOnline(healthRes?.database === 'connected')
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load dashboard data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0),
    [accounts]
  )

  const activeAccountsCount = useMemo(
    () => accounts.filter((acc) => acc.status === 'ACTIVE').length,
    [accounts]
  )

  const { monthSpend, monthReceived } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    let spend = 0
    let received = 0

    transactions.forEach((tx) => {
      const dt = new Date(tx.createdAt)
      if (dt.getMonth() !== currentMonth || dt.getFullYear() !== currentYear) return
      const fromId = tx.fromAccount?._id || tx.fromAccount
      const toId = tx.toAccount?._id || tx.toAccount
      const isFromMine = userAccountIds.has(fromId)
      const isToMine = userAccountIds.has(toId)

      if (isFromMine && !isToMine) spend += Number(tx.amount || 0)
      else if (isToMine && !isFromMine) received += Number(tx.amount || 0)
    })

    return { monthSpend: spend, monthReceived: received }
  }, [transactions, userAccountIds])

  const handleCopyAccount = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 1800)
    } catch {
      // Ignore clipboard failure
    }
  }

  const handleScanPaySubmit = (e) => {
    e.preventDefault()
    if (!scanTarget.trim()) return
    setShowScanPayModal(false)
    navigate(`/transfer?to=${encodeURIComponent(scanTarget.trim())}`)
  }

  return (
    <AppLayout>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Hero Welcome Banner matching Screenshot */}
      <HeroBankBanner userName={user?.name || 'Member'} engineOnline={engineOnline} />

      {/* 4-Column KPI Row */}
      <section className="kpi-grid" style={{ marginBottom: '18px' }}>
        {/* 1. Total Balance */}
        <div className="surface-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="icon-tile">
                <Wallet size={19} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Balance
                </div>
                <div className="font-display" style={{ fontSize: '1.42rem', fontWeight: 800 }}>
                  {loading ? '...' : hideBalance ? '₹ ••••••' : formatCurrency(totalBalance)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHideBalance((p) => !p)}
              title={hideBalance ? 'Show Balance' : 'Hide Balance'}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-success)' }}>
              ↑ Ledger Derived
            </span>
            <MiniSparkline color="var(--status-success)" up />
          </div>
        </div>

        {/* 2. This Month Spend */}
        <div className="surface-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div className="icon-tile">
              <ArrowLeftRight size={19} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                This Month Spend
              </div>
              <div className="font-display" style={{ fontSize: '1.42rem', fontWeight: 800 }}>
                {loading ? '...' : hideBalance ? '₹ ••••••' : formatCurrency(monthSpend)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-danger)' }}>
              ↓ Outflow Debits
            </span>
            <MiniSparkline color="var(--status-danger)" up={false} />
          </div>
        </div>

        {/* 3. This Month Received */}
        <div className="surface-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div className="icon-tile">
              <ArrowDownToLine size={19} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                This Month Received
              </div>
              <div className="font-display" style={{ fontSize: '1.42rem', fontWeight: 800 }}>
                {loading ? '...' : hideBalance ? '₹ ••••••' : formatCurrency(monthReceived)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-success)' }}>
              ↑ Inflow Credits
            </span>
            <MiniSparkline color="var(--status-success)" up />
          </div>
        </div>

        {/* 4. Active Accounts */}
        <div className="surface-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div className="icon-tile">
              <Landmark size={19} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Active Accounts
              </div>
              <div className="font-display" style={{ fontSize: '1.42rem', fontWeight: 800 }}>
                {loading ? '...' : `${activeAccountsCount} Account${activeAccountsCount === 1 ? '' : 's'}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {accounts.length} total linked
            </span>
            <Link to="/accounts" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>Manage</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Middle Row: Financial Overview & Multi-Currency Wallet */}
      <section className="analytics-grid" style={{ marginBottom: '18px' }}>
        <FinancialOverviewChart
          transactions={transactions}
          accounts={accounts}
          totalBalance={totalBalance}
        />
        <MultiCurrencyDonut accounts={accounts} />
      </section>

      {/* Bottom 3-Column Row: Recent Transactions | Quick Actions | Smart Cards */}
      <section className="bottom-triple-grid">
        {/* Recent Transactions */}
        <div className="surface-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="font-display" style={{ fontSize: '1.02rem', fontWeight: 700 }}>
              Recent Transactions
            </h3>
            <Link to="/transactions" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="surface-elevated" style={{ padding: '20px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              No transactions yet. Create an account and send or receive funds.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transactions.slice(0, 3).map((tx) => {
                const fromId = tx.fromAccount?._id || tx.fromAccount
                const toId = tx.toAccount?._id || tx.toAccount
                const isFromMine = userAccountIds.has(fromId)
                const isToMine = userAccountIds.has(toId)
                const isInternal = isFromMine && isToMine
                const isCredit = !isFromMine && isToMine
                const peerName = isInternal
                  ? 'Internal Vault Transfer'
                  : isCredit
                    ? `Received from ${tx.fromAccount?.user?.name || 'Account'}`
                    : `Sent to ${tx.toAccount?.user?.name || 'Account'}`

                return (
                  <div
                    key={tx._id}
                    className="surface-elevated"
                    style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isCredit ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                          color: isCredit ? 'var(--status-success)' : 'var(--status-danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {peerName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(tx.createdAt)}
                        </div>
                      </div>
                    </div>

                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: isCredit ? 'var(--status-success)' : isInternal ? 'var(--text-primary)' : 'var(--status-danger)',
                        flexShrink: 0
                      }}
                    >
                      {isCredit ? '+' : isInternal ? '' : '−'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions (Matching Screenshot 4 Tiles) */}
        <div className="surface-card" style={{ padding: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '14px' }}>
            Quick Actions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Send Money', icon: Send, action: () => navigate('/transfer') },
              { label: 'Receive Money', icon: ArrowDownToLine, action: () => setShowReceiveModal(true) },
              { label: 'Manage Cards', icon: CreditCard, action: () => navigate('/cards') },
              { label: 'Scan & Pay', icon: QrCode, action: () => setShowScanPayModal(true) }
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="surface-elevated"
                  style={{
                    padding: '15px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span className="icon-tile" style={{ width: '38px', height: '38px', borderRadius: '11px' }}>
                    <Icon size={18} />
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Smart Cards. Smarter Control. (Matching Screenshot Bottom-Right) */}
        <div
          className="surface-card"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            overflow: 'hidden'
          }}
        >
          {/* Tilted Miniature Glowing VaultX Card */}
          <div
            style={{
              width: '152px',
              minWidth: '142px',
              height: '102px',
              borderRadius: '14px',
              padding: '12px',
              background: 'linear-gradient(135deg, #071910 0%, #103824 60%, #05110b 100%)',
              border: '1px solid rgba(34, 229, 138, 0.45)',
              boxShadow: '0 12px 26px rgba(16, 185, 129, 0.22)',
              color: '#f3f7f4',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transform: 'rotate(-6deg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                Vault<span style={{ color: '#22e58a' }}>X</span>
              </span>
              <span style={{ width: '20px', height: '14px', borderRadius: '3px', background: '#e8c66a' }} />
            </div>
            <div className="font-mono" style={{ fontSize: '0.66rem', opacity: 0.8 }}>
              •••• {accounts[0]?._id ? accounts[0]._id.slice(-4).toUpperCase() : '4821'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#f59e0b', marginLeft: '-5px' }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '6px' }}>
              Smart Cards.
              <br />
              Smarter Control.
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '12px' }}>
              Freeze, unfreeze and manage your card anytime.
            </p>
            <Link to="/cards" className="btn btn-primary btn-sm">
              <span>Manage Card</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Receive Money Modal */}
      {showReceiveModal && (
        <div className="modal-backdrop" onClick={() => setShowReceiveModal(false)}>
          <div className="surface-card modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              Receive Money
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Share any of your active Account IDs or your registered email (<strong>{user?.email}</strong>) to receive instant transfers.
            </p>

            {accounts.length === 0 ? (
              <Link to="/accounts" className="btn btn-primary" style={{ width: '100%' }}>
                Open an Account First
              </Link>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {accounts.map((acc) => (
                  <div key={acc._id} className="surface-elevated" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {acc.currency} Account ({acc.status})
                      </div>
                      <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc._id}
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleCopyAccount(acc._id)}>
                      {copiedId === acc._id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === acc._id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan & Pay Modal */}
      {showScanPayModal && (
        <div className="modal-backdrop" onClick={() => setShowScanPayModal(false)}>
          <div className="surface-card modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              Quick Scan &amp; Pay
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter recipient Email or Account ID to jump straight into a verified transfer.
            </p>
            <form onSubmit={handleScanPaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                required
                autoFocus
                className="form-input"
                placeholder="recipient@email.com or 24-char Account ID"
                value={scanTarget}
                onChange={(e) => setScanTarget(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <span>Proceed to Pay</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
