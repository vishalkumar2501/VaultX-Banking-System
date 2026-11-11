import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { formatCardNumber, formatCurrency } from '../utils/formatters'

const CARD_VARIANTS = ['obsidian', 'pearl', 'navy', 'holo']

export function VirtualBankCard({
  account,
  ownerName = 'Account Holder',
  variantIndex = 0,
  onRefreshBalance,
  onToggleStatus,
  toggling = false,
  compact = false
}) {
  const [revealId, setRevealId] = useState(false)
  const [copied, setCopied] = useState(false)

  const variant = CARD_VARIANTS[variantIndex % CARD_VARIANTS.length]
  const isLightCard = variant === 'pearl'
  const mutedColor = isLightCard ? 'rgba(11, 20, 34, 0.58)' : 'rgba(255, 255, 255, 0.7)'
  const isActive = account.status === 'ACTIVE'

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(account._id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Ignore clipboard failures
    }
  }

  return (
    <div
      className={`bank-card bank-card--${variant}`}
      style={{ minHeight: compact ? '182px' : '210px', opacity: isActive ? 1 : 0.85 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', letterSpacing: '-0.02em' }}>
            Vault<span style={{ color: isLightCard ? '#059669' : '#22e58a' }}>X</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: mutedColor, fontWeight: 600 }}>
            {account.currency || 'INR'} Smart Vault
          </div>
        </div>

        <button
          type="button"
          disabled={!onToggleStatus || toggling || account.status === 'CLOSED'}
          onClick={() => onToggleStatus && onToggleStatus(account._id, isActive ? 'FROZEN' : 'ACTIVE')}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: onToggleStatus ? 'pointer' : 'default'
          }}
        >
          <span style={{ color: isActive ? mutedColor : '#fb7185' }}>{toggling ? '...' : account.status}</span>
          <span
            style={{
              width: '32px',
              height: '18px',
              borderRadius: '999px',
              background: isActive ? '#10b981' : '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: isActive ? 'flex-end' : 'flex-start',
              padding: '2px'
            }}
          >
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff' }} />
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 10px', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: mutedColor, fontWeight: 600 }}>Available Balance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-display" style={{ fontSize: compact ? '1.35rem' : '1.55rem', fontWeight: 800 }}>
              {formatCurrency(account.balance ?? 0, account.currency || 'INR')}
            </span>
            {onRefreshBalance && (
              <button
                type="button"
                onClick={() => onRefreshBalance(account._id)}
                title="Refresh derived ledger balance"
                style={{
                  border: 'none',
                  background: isLightCard ? 'rgba(11,20,34,0.08)' : 'rgba(255,255,255,0.12)',
                  color: 'inherit',
                  borderRadius: '8px',
                  width: '25px',
                  height: '25px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        </div>

        <svg width="34" height="26" viewBox="0 0 36 28" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="35" height="27" rx="5" fill="#E8C66A" stroke="#BA9230" />
          <path d="M12 1V27M24 1V27M1 10H12M24 10H35M1 18H12M24 18H35" stroke="#A67F22" strokeWidth="1" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 1 }}>
        <div
          className="font-mono"
          style={{ fontSize: revealId ? '0.72rem' : '0.84rem', letterSpacing: revealId ? '0.02em' : '0.08em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {formatCardNumber(account._id, revealId)}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setRevealId((prev) => !prev)}
            style={{ border: 'none', background: isLightCard ? 'rgba(11,20,34,0.08)' : 'rgba(255,255,255,0.14)', color: 'inherit', borderRadius: '7px', padding: '5px', display: 'inline-flex', cursor: 'pointer' }}
          >
            {revealId ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{ border: 'none', background: isLightCard ? 'rgba(11,20,34,0.08)' : 'rgba(255,255,255,0.14)', color: 'inherit', borderRadius: '7px', padding: '5px 8px', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'ID'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '12px', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Holder</div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{ownerName}</div>
        </div>
        {/* Overlapping Network Circles (Screenshot Smart Cards look) */}
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', opacity: 0.9 }} />
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f59e0b', marginLeft: '-7px', opacity: 0.9 }} />
        </div>
      </div>
    </div>
  )
}
