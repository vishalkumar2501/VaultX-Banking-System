import { useMemo, useState } from 'react'
import { formatCurrency, formatShortDate } from '../utils/formatters'

/**
 * Smooth SVG cashflow & balance curve inspired by the GoWallet "Wallet transaction" chart.
 * Builds data points dynamically from real user transactions & current account balances.
 */
export function BalanceSparklineChart({ transactions = [], accounts = [], totalBalance = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const accountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const points = useMemo(() => {
    if (!transactions.length) {
      return [
        { label: 'Start', value: totalBalance },
        { label: 'Current', value: totalBalance }
      ]
    }

    // Reconstruct running balance trajectory chronologically from latest balance backwards
    const chronological = [...transactions]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-10)

    let running = totalBalance
    const backwards = []
    for (let i = chronological.length - 1; i >= 0; i--) {
      const tx = chronological[i]
      const fromId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount
      const toId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount
      const isOutgoing = accountIds.has(fromId)
      const isIncoming = accountIds.has(toId)

      backwards.unshift({
        label: formatShortDate(tx.createdAt),
        value: Math.max(0, running),
        delta: isIncoming && !isOutgoing ? tx.amount : isOutgoing && !isIncoming ? -tx.amount : 0
      })

      if (isIncoming && !isOutgoing) {
        running -= tx.amount
      } else if (isOutgoing && !isIncoming) {
        running += tx.amount
      }
    }

    return [
      { label: 'Opening', value: Math.max(0, running), delta: 0 },
      ...backwards
    ]
  }, [transactions, accountIds, totalBalance])

  const width = 640
  const height = 195
  const padX = 24
  const padY = 24

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const span = maxVal - minVal || Math.max(maxVal, 100)

  const coords = points.map((pt, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * (width - padX * 2)
    const y =
      height - padY - ((pt.value - minVal) / span) * (height - padY * 2)
    return { ...pt, x, y }
  })

  // Smooth cubic bezier path
  const linePath = coords.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[idx - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - 6} L ${coords[0].x} ${height - 6} Z`
  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : coords[coords.length - 1]

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Ledger Balance Trajectory
          </div>
          <div className="font-display" style={{ fontSize: '1.45rem', fontWeight: 800 }}>
            {formatCurrency(activePoint.value)}
          </div>
        </div>
        <span className="pill pill-neutral font-mono">
          {activePoint.label}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="vaultxChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill-start)" />
            <stop offset="100%" stopColor="var(--chart-fill-end)" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Grid Lines */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = padY + ratio * (height - padY * 2)
          return (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--chart-grid)"
              strokeDasharray="4 4"
            />
          )
        })}

        <path d={areaPath} fill="url(#vaultxChartGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--chart-stroke)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {coords.map((pt, idx) => {
          const isActive = hoveredIdx === idx || (hoveredIdx === null && idx === coords.length - 1)
          return (
            <g
              key={idx}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              {isActive && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="8"
                  fill="var(--accent-soft)"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 4.5 : 3}
                fill="var(--bg-surface)"
                stroke="var(--chart-stroke)"
                strokeWidth="2.4"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
