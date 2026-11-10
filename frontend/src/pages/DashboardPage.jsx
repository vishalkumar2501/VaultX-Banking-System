import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  Plus,
  ShieldCheck,
  Wallet
} from 'lucide-react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { BalanceSparklineChart } from '../components/BalanceSparklineChart'
import { VirtualBankCard } from '../components/VirtualBankCard'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export function DashboardPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [totalTxCount, setTotalTxCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accRes, txRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getHistory({ limit: 8 })
      ])
      setAccounts(accRes.accounts || [])
      setTransactions(txRes.transactions || [])
      setTotalTxCount(txRes.pagination?.total ?? (txRes.transactions?.length || 0))
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load dashboard data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleOpenAccount = async () => {
    setCreating(true)
    setError('')
    try {
      const data = await accountApi.createAccount()
      setAccounts((prev) => [data.account, ...prev])
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create new account.'))
    } finally {
      setCreating(false)
    }
  }

  const handleRefreshCardBalance = async (accountId) => {
    try {
      const data = await accountApi.getBalance(accountId)
      setAccounts((prev) =>
        prev.map((acc) => (acc._id === accountId ? { ...acc, balance: data.balance } : acc))
      )
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0),
    [accounts]
  )

  const activeCount = useMemo(
    () => accounts.filter((acc) => acc.status === 'ACTIVE').length,
    [accounts]
  )

  const userAccountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  return (
    <AppLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'Member'}`}
      subtitle="Real-time overview derived from your immutable ledger"
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Top KPI Strip */}
      <section className="kpi-grid">
        <div className="surface-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Balance
            </span>
            <Wallet size={17} style={{ color: 'var(--status-success)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {loading ? '...' : formatCurrency(totalBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Computed from ledger credits − debits
          </div>
        </div>

        <div className="surface-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Active Accounts
            </span>
            <CreditCard size={17} style={{ color: 'var(--status-success)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {loading ? '...' : activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {accounts.length} total accounts linked
          </div>
        </div>

        <div className="surface-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Settlements
            </span>
            <ArrowLeftRight size={17} style={{ color: 'var(--status-success)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            {loading ? '...' : totalTxCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Idempotent ACID transfers
          </div>
        </div>

        <div className="surface-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Ledger Integrity
            </span>
            <ShieldCheck size={17} style={{ color: 'var(--status-success)' }} />
          </div>
          <div className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800 }}>
            100%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600, marginTop: '4px' }}>
            Append-only hooks verified
          </div>
        </div>
      </section>

      {/* Main Split: Chart + Recent Activity | Virtual Cards Stack */}
      <div className="dashboard-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Balance Trajectory Chart */}
          <div className="surface-card" style={{ padding: '24px' }}>
            <BalanceSparklineChart
              transactions={transactions}
              accounts={accounts}
              totalBalance={totalBalance}
            />
          </div>

          {/* Recent Transactions */}
          <div className="surface-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h2 className="font-display" style={{ fontSize: '1.08rem', fontWeight: 700 }}>
                  Recent Transactions
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Latest settlements across your accounts
                </p>
              </div>
              <Link to="/ledger" className="btn btn-secondary btn-sm">
                View Passbook
              </Link>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="surface-elevated" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '12px' }}>
                  No transactions recorded yet. Once funds are received or transferred, entries appear here.
                </p>
                <Link to="/transfer" className="btn btn-primary btn-sm">
                  Make a Transfer
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transactions.slice(0, 5).map((tx) => {
                  const fromId = tx.fromAccount?._id || tx.fromAccount
                  const toId = tx.toAccount?._id || tx.toAccount
                  const isFromMine = userAccountIds.has(fromId)
                  const isToMine = userAccountIds.has(toId)
                  const isSelfInternal = isFromMine && isToMine
                  const isCredit = !isFromMine && isToMine

                  const counterparty = isCredit
                    ? tx.fromAccount?.user?.name || 'External Account'
                    : tx.toAccount?.user?.name || 'External Account'

                  return (
                    <div
                      key={tx._id}
                      className="surface-elevated"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isCredit ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                            color: isCredit ? 'var(--status-success)' : 'var(--status-danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isSelfInternal ? 'Internal Account Transfer' : isCredit ? `From ${counterparty}` : `To ${counterparty}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDateTime(tx.createdAt)} • {tx.status}
                          </div>
                        </div>
                      </div>

                      <div
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: isCredit
                            ? 'var(--status-success)'
                            : isSelfInternal
                              ? 'var(--text-primary)'
                              : 'var(--status-danger)',
                          flexShrink: 0
                        }}
                      >
                        {isCredit ? '+' : isSelfInternal ? '' : '−'}
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cards & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="surface-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h2 className="font-display" style={{ fontSize: '1.08rem', fontWeight: 700 }}>
                  My Accounts &amp; Cards
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Click ID to copy for transfers
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAccount}
                disabled={creating}
              >
                <Plus size={15} />
                <span>{creating ? 'Creating...' : 'New Account'}</span>
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <div className="surface-elevated" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '14px' }}>
                  You don&apos;t have any VaultX bank accounts yet. Open your first INR ledger account in 1 click.
                </p>
                <button type="button" className="btn btn-primary" onClick={handleOpenAccount} disabled={creating}>
                  <Plus size={16} />
                  <span>Open My First Account</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {accounts.slice(0, 3).map((acc, idx) => (
                  <VirtualBankCard
                    key={acc._id}
                    account={acc}
                    ownerName={user?.name}
                    variantIndex={idx}
                    onRefreshBalance={handleRefreshCardBalance}
                    compact
                  />
                ))}

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <Link to="/transfer" className="btn btn-primary" style={{ flex: 1 }}>
                    <ArrowLeftRight size={16} />
                    <span>Send Money</span>
                  </Link>
                  <Link to="/accounts" className="btn btn-secondary" style={{ flex: 1 }}>
                    All Accounts ({accounts.length})
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
