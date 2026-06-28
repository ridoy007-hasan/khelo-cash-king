import { useState } from 'react'

export default function JoinModal({ match, walletBalance, onClose, onConfirm }) {
  const [ign, setIgn] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const insufficientFunds = walletBalance < match.entry_fee

  async function handleConfirm() {
    if (!ign.trim()) {
      setError('Enter your Free Fire in-game name.')
      return
    }
    if (insufficientFunds) return
    setBusy(true)
    setError('')
    try {
      await onConfirm(ign.trim())
    } catch (e) {
      setError(e.message || 'Could not join match. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm glass-strong rounded-3xl p-5 relative animate-[fadeUp_0.25s_ease]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full glass flex items-center justify-center text-sm"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="font-bold text-xl mb-1">Confirm Join</h2>

        {insufficientFunds ? (
          <p className="text-sm text-red-300 mb-4">
            Your wallet balance (৳{walletBalance}) is less than the entry fee (৳{match.entry_fee}). Add money to your wallet to join this match.
          </p>
        ) : (
          <p className="text-sm text-mist mb-4">
            Enter your Free Fire details. Entry fee ৳{match.entry_fee} will be deducted from your wallet.
          </p>
        )}

        {!insufficientFunds && (
          <>
            <label className="block mb-4">
              <span className="text-xs font-medium text-mist mb-1.5 block">In-Game Name (IGN)</span>
              <input
                type="text"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="Your Free Fire display name"
                className="input-field"
                autoFocus
              />
            </label>

            {error && (
              <p className="text-sm rounded-xl px-3 py-2 mb-3 bg-red-500/15 border border-red-500/30 text-red-300">
                {error}
              </p>
            )}

            <button
              onClick={handleConfirm}
              disabled={busy}
              className="btn-liquid w-full py-3.5"
            >
              <span>{busy ? 'Joining…' : `Confirm & Pay ৳${match.entry_fee}`}</span>
            </button>
          </>
        )}

        {insufficientFunds && (
          <button onClick={onClose} className="btn-glass-outline w-full py-3.5">
            Go to Wallet
          </button>
        )}
      </div>
    </div>
  )
}
