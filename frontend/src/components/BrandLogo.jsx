export function BrandLogo({ size = 36, showTagline = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '11px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vaultxShieldGrad" x1="4" y1="4" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22e58a" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <path
          d="M21 3L36 9.2V20.5C36 29.8 29.6 36.8 21 39.5C12.4 36.8 6 29.8 6 20.5V9.2L21 3Z"
          fill="url(#vaultxShieldGrad)"
        />
        <path
          d="M14.5 14.5L21 28L27.5 14.5"
          stroke="#03150c"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12 }}>
        <span className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          Vault<span style={{ color: 'var(--status-success)' }}>X</span>
        </span>
        {showTagline && (
          <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Your Money. Our Vault.
          </span>
        )}
      </div>
    </div>
  )
}
