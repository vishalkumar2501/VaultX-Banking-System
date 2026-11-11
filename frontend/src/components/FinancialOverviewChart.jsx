import { useMemo, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { formatCurrency, formatShortDate } from '../utils/formatters'

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y']

function formatAxisLabel(val) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (val >= 1000) return `₹${Math.round(val / 1000)}K`
  return `₹${Math.round(val)}`
}

export function FinancialOverviewChart({ transactions = [], accounts = [], totalBalance = 0 }) {
  const [range, setRange] = useState('1M')
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const accountIds = useMemo(() => new Set(accounts.map((a) => a._id)), [accounts])

  const points = useMemo(() => {
    const now = Date.now()
    const daysMap = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }
    const cutoff = now - daysMap[range] * 24 * 60 * 60 * 1000

    const sorted = [...transactions]
      .filter((tx) => new Date(tx.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-14)

    if (!sorted.length) {
      return [
        { label: 'Start', value: totalBalance },
        { label: 'Mid', value: totalBalance },
        { label: 'Now', value: totalBalance }
      ]
    }

    let running = totalBalance
    const series = []
    for (let i = sorted.length - 1; i >= 0; i--) {
      const tx = sorted[i]
      const fromId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount
      const toId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount
      const isOutgoing = accountIds.has(fromId)
      const isIncoming = accountIds.has(toId)

      series.unshift({ label: formatShortDate(tx.createdAt), value: Math.max(0, running) })
      if (isIncoming && !isOutgoing) running -= tx.amount
      else if (isOutgoing && !isIncoming) running += tx.amount
    }
    return [{ label: 'Opening', value: Math.max(0, running) }, ...series]
  }, [transactions, accounts, accountIds, totalBalance, range])

  const width = 680
  const height = 215
  const padL = 52
  const padR = 20
  const padT = 26
  const padB = 30

  const values = points.map((p) => p.value)
  const minVal = 0
  const maxVal = Math.max(...values, 1000)

  const coords = points.map((pt, idx) => {
    const x =
      points.length === 1
        ? (padL + width - padR) / 2
        : padL + (idx / (points.length - 1)) * (width - padL - padR)
    const y = height - padB - ((pt.value - minVal) / (maxVal - minVal || 1)) * (height - padT - padB)
    return { ...pt, x, y }
  })

  const linePath = coords.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[idx - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padB} L ${coords[0].x} ${height - padB} Z`
  const activeIdx = hoveredIdx !== null ? hoveredIdx : coords.length - 1
  const activePoint = coords[activeIdx]

  return (
    <div className="surface-card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} style={{ color: 'var(--status-success)' }} />
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Financial Overview
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setRange(tf)}
              style={{
                border: 'none',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: range === tf ? 'var(--accent-primary)' : 'transparent',
                color: range === tf ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="vaultxOverviewFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fill-start)" />
            <stop offset="100%" stopColor="var(--chart-fill-end)" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padB - ratio * (height - padT - padB)
          const labelVal = minVal + ratio * (maxVal - minVal)
          return (
            <g key={ratio}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="var(--chart-grid)" strokeDasharray="3 4" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11" fontFamily="JetBrains Mono, monospace">
                {formatAxisLabel(labelVal)}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#vaultxOverviewFill)" />
        <path d={linePath} fill="none" stroke="var(--chart-stroke)" strokeWidth="2.8" strokeLinecap="round" />

        {coords.map((pt, idx) => {
          const isActive = activeIdx === idx
          return (
            <g
              key={idx}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              {isActive && <circle cx={pt.x} cy={pt.y} r="8.5" fill="var(--accent-soft)" />}
              <circle cx={pt.x} cy={pt.y} r={isActive ? 4.5 : 3} fill="#ffffff" stroke="var(--chart-stroke)" strokeWidth="2" />
              {(idx === 0 || idx === coords.length - 1 || idx === Math.floor(coords.length / 2)) && (
                <text x={pt.x} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="11">
                  {pt.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Floating Value Tooltip */}
        <g transform={`translate(${Math.min(width - 135, Math.max(padL, activePoint.x - 56))}, ${Math.max(4, activePoint.y - 36)})`}>
          <rect width="112" height="26" rx="7" fill="var(--bg-surface-solid)" stroke="var(--border-strong)" />
          <text x="56" y="17" textAnchor="middle" fill="var(--text-primary)" fontSize="11.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {formatCurrency(activePoint.value)}
          </text>
        </g>
      </svg>
    </div>
  )
}
