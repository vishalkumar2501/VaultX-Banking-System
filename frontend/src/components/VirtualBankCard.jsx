import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { formatCardNumber, formatCurrency } from '../utils/formatters'

const CARD_VARIANTS = ['pearl', 'navy', 'obsidian', 'holo']

export function VirtualBankCard({
  account,
  ownerName = 'Account Holder',
  variantIndex = 0,
  onRefreshBalance,
  onToggleStatus,
  refreshing = false,
  toggling = false,
  compact = false
}) {
  const [revealId, setRevealId] = useState(false)
  const [copied, setCopied] = useState(false)

  const variant = CARD_VARIANTS[variantIndex % CARD_VARIANTS.length]
  const isLightCard = variant === 'pearl'
  const mutedColor = isLightCard ? 'rgba(11, 19, 32, 0.58)' : 'rgba(255, 255, 255, 0.7)'
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
      style={{
        minHeight: compact ? '186px' : '216px',
        opacity: isActive ? 1 : 0.85
      }}
    >
      {/* Subtle Globe Wireframe Decoration (Vepay Pearl/Navy aesthetic) */}
      <svg
        width="230"
        height="230"
        viewBox="0 0 200 200"
        fill="none"
        style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-56px',
          opacity: isLightCard ? 0.09 : 0.11,
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

      {/* Top Row: Brand & Interactive Active/Freeze Toggle Switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', letterSpacing: '-0.02em' }}>
            Aegis<span style={{ color: isLightCard ? '#059669' : '#2ee58a' }}>Ledger</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: mutedColor, fontWeight: 600 }}>
            {account.currency || 'INR'} Ledger Vault
          </div>
        </div>

        <button
          type="button"
          disabled={!onToggleStatus || toggling || account.status === 'CLOSED'}
          onClick={() => onToggleStatus && onToggleStatus(account._id, isActive ? 'FROZEN' : 'ACTIVE')}
          title={
            onToggleStatus
              ? `Click to ${isActive ? 'Freeze' : 'Activate'} account`
              : `Account is ${account.status}`
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '0.73rem',
            fontWeight: 700,
            cursor: onToggleStatus ? 'pointer' : 'default',
            padding: 0
          }}
        >
          <span style={{ color: isActive ? mutedColor : '#fb7185' }}>
            {toggling ? '...' : account.status}
          </span>
          <span
            style={{
              width: '34px',
              height: '19px',
              borderRadius: '999px',
              background: isActive ? '#10b981' : '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: isActive ? 'flex-end' : 'flex-start',
              padding: '2.5px',
              transition: 'background 0.2s ease'
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
        </button>
      </div>

      {/* Middle Row: Balance + NFC + Gold EMV Chip */}
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
            <span className="font-display" style={{ fontSize: compact ? '1.35rem' : '1.58rem', fontWeight: 800 }}>
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
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Contactless NFC Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.65 }} aria-hidden="true">
            <path d="M8.5 16.5C10.5 14 10.5 10 8.5 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 18.5C15 15 15 9 12 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M15.5 20.5C19.5 16 19.5 8 15.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {/* Gold EMV Chip SVG */}
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="35" height="27" rx="5" fill="#E8C66A" stroke="#BA9230" />
            <path d="M12 1V27M24 1V27M1 10H12M24 10H35M1 18H12M24 18H35" stroke="#A67F22" strokeWidth="1" />
          </svg>
        </div>
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
        <div className="font-display" style={{ fontSize: '0.96rem', fontWeight: 800, letterSpacing: '0.06em' }}>
          VISA
        </div>
      </div>
    </div>
  )
}
