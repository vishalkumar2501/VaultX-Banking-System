import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { formatCardNumber, formatCurrency } from '../utils/formatters'

const CARD_VARIANTS = ['pearl', 'navy', 'obsidian', 'holo']

export function VirtualBankCard({
  account,
  ownerName = 'Account Holder',
  variantIndex = 0,
  onRefreshBalance,
  refreshing = false,
  compact = false
}) {
  const [revealId, setRevealId] = useState(false)
  const [copied, setCopied] = useState(false)

  // Match Dark/Light default card styling gracefully while giving multi-card variety
  const variant = CARD_VARIANTS[variantIndex % CARD_VARIANTS.length]
  const isLightCard = variant === 'pearl'
  const mutedColor = isLightCard ? 'rgba(11, 19, 32, 0.58)' : 'rgba(255, 255, 255, 0.68)'
  const isActive = account.status === 'ACTIVE'

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(account._id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard fallback ignored if blocked
    }
  }

  return (
    <div
      className={`bank-card bank-card--${variant}`}
      style={{ minHeight: compact ? '185px' : '212px' }}
    >
      {/* Subtle Globe Wireframe Decoration (Vepay Pearl/Navy aesthetic) */}
      <svg
        width="220"
        height="220"
        viewBox="0 0 200 200"
        fill="none"
        style={{
          position: 'absolute',
          right: '-38px',
          bottom: '-52px',
          opacity: isLightCard ? 0.08 : 0.1,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="100" cy="100" rx="52" ry="88" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="100" cy="100" rx="88" ry="34" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="100" x2="188" y2="100" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="12" x2="100" y2="188" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Top Row: Brand & Active Toggle Switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', letterSpacing: '-0.02em' }}>
            Vault<span style={{ color: isLightCard ? '#059669' : '#2ee58a' }}>X</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: mutedColor, fontWeight: 600 }}>
            {account.currency || 'INR'} Ledger Account
          </div>
        </div>

        {/* Authentic Vepay-style Active Toggle Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.74rem',
            fontWeight: 700
          }}
        >
          <span style={{ color: mutedColor }}>{account.status}</span>
          <span
            style={{
              width: '32px',
              height: '18px',
              borderRadius: '999px',
              background: isActive ? '#10b981' : '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: isActive ? 'flex-end' : 'flex-start',
              padding: '2px'
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff'
              }}
            />
          </span>
        </div>
      </div>

      {/* Middle Row: Balance + Gold EMV Chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '14px 0 12px',
          zIndex: 1
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: mutedColor, fontWeight: 600, marginBottom: '2px' }}>
            Available Balance
          </div>
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
                  background: isLightCard ? 'rgba(11,19,32,0.07)' : 'rgba(255,255,255,0.12)',
                  color: 'inherit',
                  borderRadius: '8px',
                  width: '26px',
                  height: '26px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* Gold EMV Chip SVG */}
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="35" height="27" rx="5" fill="#E8C66A" stroke="#BA9230" />
          <path d="M12 1V27M24 1V27M1 10H12M24 10H35M1 18H12M24 18H35" stroke="#A67F22" strokeWidth="1" />
        </svg>
      </div>

      {/* Account ID Row with Reveal & Copy */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', zIndex: 1 }}>
        <div
          className="font-mono"
          style={{
            fontSize: revealId ? '0.72rem' : '0.84rem',
            letterSpacing: revealId ? '0.03em' : '0.08em',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {formatCardNumber(account._id, revealId)}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setRevealId((prev) => !prev)}
            title={revealId ? 'Mask Account ID' : 'Show full Account ID'}
            style={{
              border: 'none',
              background: isLightCard ? 'rgba(11,19,32,0.07)' : 'rgba(255,255,255,0.14)',
              color: 'inherit',
              borderRadius: '7px',
              padding: '5px',
              display: 'inline-flex',
              cursor: 'pointer'
            }}
          >
            {revealId ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy Account ID for transfers"
            style={{
              border: 'none',
              background: isLightCard ? 'rgba(11,19,32,0.07)' : 'rgba(255,255,255,0.14)',
              color: 'inherit',
              borderRadius: '7px',
              padding: '5px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'ID'}</span>
          </button>
        </div>
      </div>

      {/* Footer: Cardholder + Network Mark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: '14px',
          zIndex: 1
        }}
      >
        <div>
          <div style={{ fontSize: '0.62rem', color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Account Holder
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{ownerName}</div>
        </div>
        <div className="font-display" style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.06em' }}>
          VISA
        </div>
      </div>
    </div>
  )
}
