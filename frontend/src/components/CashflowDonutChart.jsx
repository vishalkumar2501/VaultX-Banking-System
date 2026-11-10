import { useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'

/**
 * Concentric glowing radial cashflow visualization inspired by the GoWallet dashboard preview.
 */
export function CashflowDonutChart({ transactions = [], accounts = [] }) {
  const accountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const { totalInflow, totalOutflow, inflowPercent } = useMemo(() => {
    let inflow = 0
    let outflow = 0

    transactions.forEach((tx) => {
      const fromId = tx.fromAccount?._id || tx.fromAccount
      const toId = tx.toAccount?._id || tx.toAccount
      const isFromMine = accountIds.has(fromId)
      const isToMine = accountIds.has(toId)

      if (isToMine && !isFromMine) inflow += Number(tx.amount || 0)
      else if (isFromMine && !isToMine) outflow += Number(tx.amount || 0)
    })

    const combined = inflow + outflow
    const pct = combined > 0 ? Math.round((inflow / combined) * 100) : 100
    return { totalInflow: inflow, totalOutflow: outflow, inflowPercent: pct }
  }, [transactions, accountIds])

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (inflowPercent / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Cashflow Breakdown
        </div>
        <h3 className="font-display" style={{ fontSize: '1.12rem', fontWeight: 700, marginTop: '2px' }}>
          Credits vs Debits
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px 0' }}>
        <div style={{ position: 'relative', width: '136px', height: '136px' }}>
          <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
            {/* Outer Base Ring */}
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="12"
            />
            {/* Outflow Accent Arc */}
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="var(--status-danger)"
              strokeWidth="12"
              strokeOpacity="0.35"
            />
            {/* Inflow Glowing Emerald Arc */}
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="var(--chart-stroke)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <span className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              {inflowPercent}%
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              INFLOW RATIO
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="surface-elevated" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--chart-stroke)' }} />
            <span>Credits In</span>
          </div>
          <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px', color: 'var(--status-success)' }}>
            +{formatCurrency(totalInflow)}
          </div>
        </div>

        <div className="surface-elevated" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-danger)' }} />
            <span>Debits Out</span>
          </div>
          <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px', color: 'var(--status-danger)' }}>
            −{formatCurrency(totalOutflow)}
          </div>
        </div>
      </div>
    </div>
  )
}
