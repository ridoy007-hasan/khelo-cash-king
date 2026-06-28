import { useEffect, useState } from 'react'

export default function Countdown({ targetTime }) {
  const [remaining, setRemaining] = useState(getDiff(targetTime))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getDiff(targetTime)), 1000)
    return () => clearInterval(id)
  }, [targetTime])

  if (remaining <= 0) {
    return (
      <div className="rounded-xl py-2.5 text-center text-sm font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
        ⏱ Match started
      </div>
    )
  }

  const m = Math.floor(remaining / 60000)
  const s = Math.floor((remaining % 60000) / 1000)

  return (
    <div
      className="rounded-xl py-2.5 text-center text-sm font-semibold"
      style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
    >
      ⏱ Starts in {m}m:{s.toString().padStart(2, '0')}s
    </div>
  )
}

function getDiff(targetTime) {
  return new Date(targetTime).getTime() - Date.now()
}
