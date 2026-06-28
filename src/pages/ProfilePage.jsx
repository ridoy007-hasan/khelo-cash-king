import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const MENU = [
  { to: '/admin', label: 'Admin Panel', icon: '🛡️', adminOnly: true, highlight: true },
  { to: '/app/wallet', label: 'Wallet', icon: '💰' },
  { to: '/app/withdraw', label: 'Withdraw', icon: '⬇️' },
  { to: '/app/profile/edit', label: 'My Profile', icon: '✏️' },
  { to: '/app/rules', label: 'All Rules', icon: '📜' },
  { to: '/app/top-players', label: 'Top Players', icon: '🏆' },
]

export default function ProfilePage() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div>
      <div
        className="px-5 pt-8 pb-6 rounded-b-[2rem] mb-5"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full glass-strong flex items-center justify-center text-2xl font-bold">
            {(profile?.username || 'P')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{profile?.username || 'Player'}</p>
            <p className="text-white/70 text-sm">{profile?.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Matches" value={profile?.total_matches_played ?? 0} />
          <StatBox label="Wallet" value={`৳${profile?.wallet_balance ?? 0}`} />
          <StatBox label="Total Won" value={`৳${profile?.total_won ?? 0}`} />
        </div>
      </div>

      <div className="px-5 space-y-2.5 pb-6">
        {MENU.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 ${
              item.highlight ? 'btn-liquid' : 'glass'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className={item.highlight ? '' : 'font-medium'}>
                {item.highlight ? <span className="font-medium">{item.label}</span> : item.label}
              </span>
            </span>
            <span className="text-mist">›</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 mt-4 glass text-red-300 font-semibold"
        >
          ⏻ Logout
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="glass-strong rounded-xl py-2.5 text-center">
      <p className="font-bold text-lg leading-tight">{value}</p>
      <p className="text-[10px] text-white/70 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
