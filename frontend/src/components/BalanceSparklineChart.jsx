import { useMemo, useState } from 'react'
import { formatCurrency, formatShortDate } from '../utils/formatters'

/**
 * Smooth SVG cashflow & balance curve inspired by the GoWallet "Wallet transaction" chart.
 * Includes interactive vertical crosshair pillar & timeframe filter.
 */
export function BalanceSparklineChart({ transactions = [], accounts = [], totalBalance = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [range, setRange] = useState('all')

  const accountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const points = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const filtered = range === 'recent' ? sorted.slice(-5) : sorted.slice(-12)

    if (!filtered.length) {
      return [
        { label: 'Opening', value: totalBalance },
        { label: 'Live Balance', value: totalBalance }
      ]
    }

    let running = totalBalance
    const backwards = []
    for (let i = filtered.length - 1; i >= 0; i--) {
      const tx = filtered[i]
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

    return [{ label: 'Baseline', value: Math.max(0, running), delta: 0 }, ...backwards]
  }, [transactions, accountIds, totalBalance, range])

  const width = 640
  const height = 200
  const padX = 24
  const padY = 26

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const span = maxVal - minVal || Math.max(maxVal, 100)

  const coords = points.map((pt, idx) => {
    const x = points.length === 1 ? width / 2 : padX + (idx / (points.length - 1)) * (width - padX * 2)
    const y = height - padY - ((pt.value - minVal) / span) * (height - padY * 2)
    return { ...pt, x, y }
  })

  const linePath = coords.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[idx - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - 6} L ${coords[0].x} ${height - 6} Z`
  const activeIdx = hoveredIdx !== null ? hoveredIdx : coords.length - 1
  const activePoint = coords[activeIdx]

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Wallet Cashflow Curve
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
            <span className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {formatCurrency(activePoint.value)}
            </span>
            <span className="pill pill-neutral font-mono">{activePoint.label}</span>
          </div>
        </div>

        <div className="theme-toggle" style={{ padding: '3px' }}>
          <button
            type="button"
            className={`theme-toggle-chip ${range === 'recent' ? 'active' : ''}`}
            onClick={() => setRange('recent')}
          >
            Recent 5
          </button>
          <button
            type="button"
            className={`theme-toggle-chip ${range === 'all' ? 'active' : ''}`}
            onClick={() => setRange('all')}
          >
            All Activity
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="aegisChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill-start)" />
            <stop offset="100%" stopColor="var(--chart-fill-end)" />
          </linearGradient>
          <linearGradient id="aegisPillarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill-start)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

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

        {/* Active Vertical Spotlight Pillar (GoWallet style) */}
        <rect
          x={activePoint.x - 16}
          y={activePoint.y}
          width="32"
          height={Math.max(0, height - 6 - activePoint.y)}
          rx="10"
          fill="url(#aegisPillarGrad)"
        />

        <path d={areaPath} fill="url(#aegisChartGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--chart-stroke)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {coords.map((pt, idx) => {
          const isActive = activeIdx === idx
          return (
            <g
              key={idx}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle cx={pt.x} cy={pt.y} r="15" fill="transparent" />
              {isActive && <circle cx={pt.x} cy={pt.y} r="9" fill="var(--accent-soft)" />}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 5 : 3}
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
