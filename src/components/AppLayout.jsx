import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/app/play', label: 'Play', icon: '🎮' },
  { to: '/app/matches', label: 'My Matches', icon: '📋' },
  { to: '/app/results', label: 'Results', icon: '🏆' },
  { to: '/app/profile', label: 'Profile', icon: '👤' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-md glass-strong rounded-t-3xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-between">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors ${
                  isActive ? 'text-white' : 'text-mist'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                      isActive ? 'btn-liquid' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
