import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3 } from 'lucide-react'

export function HeroBankBanner({ userName = 'Member', engineOnline = true }) {
  return (
    <section
      className="surface-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '28px 30px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        minHeight: '185px'
      }}
    >
      {/* Architectural Emerald Bank Skyline & Shield Backdrop */}
      <svg
        viewBox="0 0 680 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          height: '100%',
          width: '62%',
          pointerEvents: 'none',
          opacity: 0.92
        }}
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <radialGradient id="heroEmeraldAura" cx="68%" cy="48%" r="55%">
            <stop offset="0%" stopColor="#18d685" stopOpacity="0.26" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bankBuildingGrad" x1="340" y1="30" x2="340" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#173828" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#07130d" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <rect width="680" height="210" fill="url(#heroEmeraldAura)" />

        {/* Futuristic City Silhouette */}
        <g opacity="0.32" fill="#133425">
          <rect x="140" y="65" width="28" height="145" rx="2" />
          <rect x="176" y="42" width="34" height="168" rx="2" />
          <rect x="218" y="88" width="26" height="122" rx="2" />
          <rect x="520" y="55" width="32" height="155" rx="2" />
          <rect x="560" y="75" width="28" height="135" rx="2" />
        </g>

        {/* Classical Bank Facade */}
        <g transform="translate(260, 26)">
          <polygon points="105,6 205,46 5,46" fill="url(#bankBuildingGrad)" stroke="#22e58a" strokeOpacity="0.45" strokeWidth="1.2" />
          <text x="105" y="38" textAnchor="middle" fill="#22e58a" fontSize="13" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
            VaultX
          </text>
          <rect x="12" y="46" width="186" height="12" fill="#0d261b" stroke="#22e58a" strokeOpacity="0.3" />
          {[28, 62, 134, 168].map((x) => (
            <rect key={x} x={x} y="58" width="14" height="96" fill="url(#bankBuildingGrad)" stroke="#22e58a" strokeOpacity="0.35" />
          ))}
          <rect x="88" y="84" width="34" height="70" rx="17" fill="#fbbf24" fillOpacity="0.22" stroke="#fbbf24" strokeOpacity="0.55" />
          <rect x="4" y="154" width="202" height="14" rx="2" fill="#0f2c1f" stroke="#22e58a" strokeOpacity="0.35" />
        </g>

        {/* Glowing VaultX Shield */}
        <g transform="translate(510, 44)">
          <path
            d="M54 4L102 22V60C102 89 81 112 54 122C27 112 6 89 6 60V22L54 4Z"
            fill="#071911"
            stroke="#22e58a"
            strokeWidth="3"
          />
          <path
            d="M34 40L54 84L74 40"
            stroke="#22e58a"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Energy Glow Waves */}
        <path d="M40 175 C 180 120, 320 195, 670 115" stroke="#22e58a" strokeOpacity="0.45" strokeWidth="1.6" />
        <path d="M90 190 C 240 140, 390 205, 670 148" stroke="#22e58a" strokeOpacity="0.25" strokeWidth="1.2" />
      </svg>

      {/* Left Foreground Content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px' }}>
        <h2
          className="font-display"
          style={{ fontSize: 'clamp(1.45rem, 2.5vw, 1.95rem)', fontWeight: 800, marginBottom: '6px' }}
        >
          Welcome back,{' '}
          <span style={{ color: 'var(--status-success)' }}>{userName}</span> 👋
        </h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Experience secure, seamless and intelligent banking.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/transfer" className="btn btn-primary btn-sm" style={{ padding: '10px 18px' }}>
            <span>Send Money</span>
            <ArrowRight size={15} />
          </Link>
          <Link to="/analytics" className="btn btn-secondary btn-sm" style={{ padding: '10px 16px' }}>
            <BarChart3 size={15} />
            <span>View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Top-Right Live Badge */}
      <div style={{ position: 'absolute', top: '16px', right: '18px', zIndex: 2 }}>
        <span
          className="pill"
          style={{
            background: 'rgba(10, 24, 18, 0.86)',
            border: '1px solid var(--border-strong)',
            color: engineOnline ? 'var(--status-success)' : 'var(--status-warning)',
            padding: '5px 12px'
          }}
        >
          <span className="live-dot" />
          <span>{engineOnline ? 'Live' : 'Syncing'}</span>
        </span>
      </div>
    </section>
  )
}
