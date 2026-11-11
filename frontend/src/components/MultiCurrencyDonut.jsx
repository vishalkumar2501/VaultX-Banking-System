import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Globe } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const CURRENCY_COLORS = {
  INR: '#18d685',
  USD: '#3b82f6',
  EUR: '#8b5cf6',
  GBP: '#f59e0b'
}

export function MultiCurrencyDonut({ accounts = [] }) {
  const { items, totalPortfolio } = useMemo(() => {
    const grouped = {}
    accounts.forEach((acc) => {
      const cur = acc.currency || 'INR'
      grouped[cur] = (grouped[cur] || 0) + Number(acc.balance || 0)
    })

    const entries = Object.entries(grouped)
    if (entries.length === 0) {
      return {
        items: [{ currency: 'INR', amount: 0, pct: 100, color: CURRENCY_COLORS.INR }],
        totalPortfolio: 0
      }
    }

    const sumAll = entries.reduce((s, [, v]) => s + v, 0)
    const mapped = entries.map(([cur, val], idx) => ({
      currency: cur,
      amount: val,
      pct: sumAll > 0 ? Math.round((val / sumAll) * 100) : idx === 0 ? 100 : 0,
      color: CURRENCY_COLORS[cur] || '#18d685'
    }))

    return { items: mapped, totalPortfolio: sumAll }
  }, [accounts])

  const radius = 50
  const circumference = 2 * Math.PI * radius

  let cumulativeOffset = 0
  const segments = items.map((item) => {
    const segLen = (item.pct / 100) * circumference
    const seg = { ...item, strokeDasharray: `${segLen} ${circumference}`, strokeDashoffset: -cumulativeOffset }
    cumulativeOffset += segLen
    return seg
  })

  const compactTotal =
    totalPortfolio >= 100000
      ? `₹${(totalPortfolio / 100000).toFixed(2)}L`
      : formatCurrency(totalPortfolio)

  return (
    <div className="surface-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} style={{ color: 'var(--status-success)' }} />
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Multi-Currency Wallet
          </h3>
        </div>
        <Link to="/accounts" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>View All</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
        {/* Multi-Color Segmented Donut Ring */}
        <div style={{ position: 'relative', width: '132px', height: '132px', margin: '0 auto' }}>
          <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="16" />
            {segments.map((seg) => (
              <circle
                key={seg.currency}
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
              />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span className="font-display" style={{ fontSize: '1.08rem', fontWeight: 800 }}>
              {compactTotal}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
          </div>
        </div>

        {/* Currency Legend Rows */}
        <div style={{ flex: 1, minWidth: '155px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item) => (
            <div key={item.currency} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color }} />
                <span style={{ fontWeight: 700 }}>{item.currency}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-mono" style={{ fontWeight: 600 }}>{formatCurrency(item.amount, item.currency)}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.76rem', width: '34px', textAlign: 'right' }}>
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
