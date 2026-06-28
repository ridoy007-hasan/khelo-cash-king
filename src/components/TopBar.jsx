import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopBar({ title, subtitle, showWallet = true, onBack }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="px-5 pt-6 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center text-lg"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <div>
          <p className="text-mist text-xs">{subtitle}</p>
          <h1 className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
        </div>
      </div>

      {showWallet && (
        <button
          onClick={() => navigate('/app/wallet')}
          className="glass rounded-full px-4 py-2 flex items-center gap-2"
        >
          <span className="text-gold">৳</span>
          <span className="font-semibold text-sm">{profile?.wallet_balance ?? 0}</span>
        </button>
      )}
    </div>
  )
}
