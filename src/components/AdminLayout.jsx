import { Navigate, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/matches', label: 'Matches', icon: '🏆' },
  { to: '/admin/payouts', label: 'Payouts', icon: '💸' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
]

export default function AdminLayout() {
  const { isAdmin, loading, profile } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-mist">Loading…</div>
  }
  if (!isAdmin) {
    return <Navigate to="/app/play" replace />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="px-5 pt-7 pb-5 rounded-b-[2rem] flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
      >
        <NavLink to="/app/profile" className="w-9 h-9 rounded-full glass-strong flex items-center justify-center">←</NavLink>
        <div>
          <p className="text-white/70 text-xs">Signed in as {profile?.username}</p>
          <h1 className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>Admin Panel</h1>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 pb-24">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-md glass-strong rounded-t-3xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-between">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl ${isActive ? 'text-white' : 'text-mist'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-xl w-9 h-9 flex items-center justify-center rounded-full ${isActive ? 'btn-liquid' : ''}`}>
                    {tab.icon}
                  </span>
                  <span className="text-[11px] font-medium">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
