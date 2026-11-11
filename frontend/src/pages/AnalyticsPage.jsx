import { useCallback, useEffect, useMemo, useState } from 'react'
import { accountApi, extractErrorMessage, transactionApi } from '../api/client'
import { AppLayout } from '../components/AppLayout'
import { CashflowDonutChart } from '../components/CashflowDonutChart'
import { FinancialOverviewChart } from '../components/FinancialOverviewChart'
import { MultiCurrencyDonut } from '../components/MultiCurrencyDonut'
import { formatCurrency } from '../utils/formatters'

export function AnalyticsPage() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accRes, txRes] = await Promise.all([
        accountApi.getAccounts(),
        transactionApi.getHistory({ limit: 100 })
      ])
      setAccounts(accRes.accounts || [])
      setTransactions(txRes.transactions || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load analytics.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0),
    [accounts]
  )

  const avgTxAmount = useMemo(() => {
    if (!transactions.length) return 0
    return transactions.reduce((s, tx) => s + Number(tx.amount || 0), 0) / transactions.length
  }, [transactions])

  return (
    <AppLayout>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          Financial Analytics
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Deep insight into ledger inflows, outflows, and currency distribution.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: '18px' }}>
        <div className="surface-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Net Portfolio Value</div>
          <div className="font-display" style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : formatCurrency(totalBalance)}
          </div>
        </div>
        <div className="surface-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Avg Settlement Ticket</div>
          <div className="font-display" style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : formatCurrency(avgTxAmount)}
          </div>
        </div>
        <div className="surface-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Settled Transactions</div>
          <div className="font-display" style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : transactions.length}
          </div>
        </div>
        <div className="surface-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Active Vaults</div>
          <div className="font-display" style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : accounts.filter((a) => a.status === 'ACTIVE').length}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <FinancialOverviewChart transactions={transactions} accounts={accounts} totalBalance={totalBalance} />
      </div>

      <div className="dashboard-split" style={{ marginTop: 0 }}>
        <MultiCurrencyDonut accounts={accounts} />
        <div className="surface-card" style={{ padding: '22px' }}>
          <CashflowDonutChart transactions={transactions} accounts={accounts} />
        </div>
      </div>
    </AppLayout>
  )
}
