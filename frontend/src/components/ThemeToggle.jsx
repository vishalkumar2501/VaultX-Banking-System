import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Theme switcher">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`theme-toggle-chip ${theme === 'light' ? 'active' : ''}`}
        style={{ border: 'none', background: theme === 'light' ? 'var(--bg-surface)' : 'transparent', cursor: 'pointer' }}
        title="Light Mode (Vepay Daylight)"
      >
        <Sun size={14} />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`theme-toggle-chip ${theme === 'dark' ? 'active' : ''}`}
        style={{ border: 'none', background: theme === 'dark' ? 'var(--bg-surface)' : 'transparent', cursor: 'pointer' }}
        title="Dark Mode (Obsidian Emerald)"
      >
        <Moon size={14} />
        <span>Dark</span>
      </button>
    </div>
  )
}
