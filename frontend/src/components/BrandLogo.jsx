export function BrandLogo({ size = 34, showTagline = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="aegisBrandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--status-success)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#aegisBrandGrad)" />
        {/* Shield + Ledger Columns Geometry */}
        <path
          d="M20 7.5L30 11.8V19.6C30 25.8 25.7 30.8 20 32.8C14.3 30.8 10 25.8 10 19.6V11.8L20 7.5Z"
          stroke="var(--accent-primary-text)"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 22.5L20 14.5L24.5 22.5M17 20H23"
          stroke="var(--accent-primary-text)"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.08 }}>
        <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          Aegis<span style={{ color: 'var(--status-success)' }}>Ledger</span>
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: '0.64rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '0.09em'
            }}
          >
            ATOMIC CORE BANKING
          </span>
        )}
      </div>
    </div>
  )
}
