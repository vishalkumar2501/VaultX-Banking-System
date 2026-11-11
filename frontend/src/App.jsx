import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AccountsPage } from './pages/AccountsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AuthPage } from './pages/AuthPage'
import { CardsPage } from './pages/CardsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LedgerPage } from './pages/LedgerPage'
import { SettingsPage } from './pages/SettingsPage'
import { SupportPage } from './pages/SupportPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransferPage } from './pages/TransferPage'
import { TreasuryPage } from './pages/TreasuryPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Verifying session...
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function SystemOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.isSystemUser ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><AuthPage mode="register" /></PublicOnlyRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
            <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute><LedgerPage /></ProtectedRoute>} />
            <Route path="/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/treasury" element={<SystemOnlyRoute><TreasuryPage /></SystemOnlyRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
