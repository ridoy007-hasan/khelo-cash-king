import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import AuthPage from './pages/AuthPage'
import AppLayout from './components/AppLayout'
import PlayPage from './pages/PlayPage'
import MatchListPage from './pages/MatchListPage'
import MatchLobbyPage from './pages/MatchLobbyPage'
import PlayerJoinPage from './pages/PlayerJoinPage'
import MyMatchesPage from './pages/MyMatchesPage'
import ResultsPage from './pages/ResultsPage'
import ProfilePage from './pages/ProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'
import WalletPage from './pages/WalletPage'
import WithdrawPage from './pages/WithdrawPage'
import RulesPage from './pages/RulesPage'
import TopPlayersPage from './pages/TopPlayersPage'

import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMatches from './pages/admin/AdminMatches'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminUsers from './pages/admin/AdminUsers'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <SplashLoader />
  if (!session) return <Navigate to="/auth" replace />
  return children
}

function SplashLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-10 h-10 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="play" element={<PlayPage />} />
            <Route path="matches-list/:mode" element={<MatchListPage />} />
            <Route path="lobby/:matchId" element={<MatchLobbyPage />} />
            <Route path="join/:matchId" element={<PlayerJoinPage />} />
            <Route path="matches" element={<MyMatchesPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<ProfileEditPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="withdraw" element={<WithdrawPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="top-players" element={<TopPlayersPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
