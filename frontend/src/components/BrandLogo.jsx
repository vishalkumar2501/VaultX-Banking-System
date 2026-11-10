export function BrandLogo({ size = 32, showTagline = false }) {
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
        <rect width="40" height="40" rx="11" fill="var(--accent-primary)" />
        <path
          d="M12 13.5L20 27.5L28 13.5"
          stroke="var(--accent-primary-text)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="14" r="2.6" fill="var(--accent-primary-text)" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          Vault<span style={{ color: 'var(--status-success)' }}>X</span>
        </span>
        {showTagline && (
          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
            CORE LEDGER
          </span>
        )}
      </div>
    </div>
  )
}
