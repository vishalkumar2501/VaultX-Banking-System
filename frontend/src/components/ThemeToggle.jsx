import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 8px',
        borderRadius: '999px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        cursor: 'pointer'
      }}
    >
      <Sun size={14} style={{ color: !isDark ? 'var(--status-warning)' : 'var(--text-muted)' }} />
      <span
        style={{
          width: '34px',
          height: '18px',
          borderRadius: '999px',
          background: isDark ? 'var(--accent-primary)' : '#94a3b8',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: isDark ? 'flex-end' : 'flex-start',
          padding: '2px',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff' }} />
      </span>
      <Moon size={14} style={{ color: isDark ? 'var(--status-success)' : 'var(--text-muted)' }} />
    </button>
  )
}
