import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MODE_LABELS = {
  br: 'BR Match',
  clash_squad: 'Clash Squad',
  lone_wolf: 'Lone Wolf',
  cs_1v1_2v2: 'CS 1v1/2v2',
}

export default function PlayerJoinPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ign, setIgn] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single()
      setMatch(matchData)

      if (user) {
        const { data: existing } = await supabase
          .from('match_participants')
          .select('id')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (existing) setAlreadyJoined(true)
      }
      setLoading(false)
    }
    load()
  }, [matchId, user])

  async function handleJoin() {
    if (!ign.trim()) {
      setError('গেমের নামটি লিখুন।')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()

      if (!freshProfile || freshProfile.wallet_balance < match.entry_fee) {
        throw new Error('Insufficient balance. Please add money to your wallet.')
      }

      // Auto-pick the next open slot — players don't choose a slot themselves.
      const { data: existingParticipants } = await supabase
        .from('match_participants')
        .select('slot_number')
        .eq('match_id', matchId)
      const taken = new Set((existingParticipants || []).map((p) => p.slot_number))
      const slotArray = Array.from({ length: match.max_slots }, (_, i) => i + 1)
      let targetSlot = slotArray.find((n) => !taken.has(n))

      if (!targetSlot) throw new Error('This match just filled up. Try another match.')

      let joinErr = null
      for (let attempt = 0; attempt < 3 && targetSlot; attempt++) {
        const res = await supabase.from('match_participants').insert({
          match_id: matchId,
          user_id: user.id,
          ign: ign.trim(),
          slot_number: targetSlot,
        })
        joinErr = res.error
        if (!joinErr) break
        if (joinErr.code === '23505') {
          // slot taken in the meantime — try the next one
          taken.add(targetSlot)
          targetSlot = slotArray.find((n) => !taken.has(n))
          continue
        }
        break
      }

      if (joinErr) throw new Error('Could not join match. Try again.')

      await supabase
        .from('profiles')
        .update({ wallet_balance: freshProfile.wallet_balance - match.entry_fee })
        .eq('id', user.id)

      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'entry_fee',
        amount: match.entry_fee,
        status: 'approved',
        admin_note: `Entry fee for match #${matchId}`,
      })

      const { data: freshMatch } = await supabase.from('matches').select('filled_slots').eq('id', matchId).single()
      await supabase.from('matches').update({ filled_slots: (freshMatch?.filled_slots || 0) + 1 }).eq('id', matchId)

      await refreshProfile()
      navigate(`/app/matches`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (loading) return <p className="text-mist text-center py-16">Loading…</p>
  if (!match) return <p className="text-mist text-center py-16">Match not found.</p>

  return (
    <div className="min-h-screen px-5 pt-6 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-full glass flex items-center justify-center mb-4"
        aria-label="Back"
      >
        ←
      </button>

      <div className="glass-strong rounded-3xl p-5">
        <p className="font-bold text-lg">
          {MODE_LABELS[match.game_mode]} ({match.match_type}) {match.map_name && `· ${match.map_name}`}
        </p>
        <p className="text-mist text-sm mt-1">
          {new Date(match.match_datetime).toLocaleString('en-BD', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>

        {match.rules_note && (
          <p className="text-amber-400 text-sm mt-3 leading-relaxed">{match.rules_note}</p>
        )}

        <div className="flex justify-between mt-4 pb-4 border-b border-white/10">
          <p className="text-sm">Win Prize: <span className="font-bold text-gold">৳{match.win_prize}</span></p>
          <p className="text-sm">Entry Fee: <span className="font-bold">৳{match.entry_fee}</span></p>
        </div>

        {alreadyJoined ? (
          <div className="mt-5 rounded-xl py-3 text-center text-sm font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
            ✓ You've already joined this match
          </div>
        ) : (
          <>
            <p className="text-center text-sm font-medium text-amber-400 mt-4 mb-1 leading-relaxed">
              *অবশ্যই এখানে আপনার গেমের নামটি দিয়ে জয়েন করবেন।
            </p>

            <div className="flex justify-center my-4">
              <span className="bg-gold text-ink text-xs font-bold px-4 py-1.5 rounded-full">
                {match.match_type}
              </span>
            </div>

            <input
              type="text"
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="Player 1 Name"
              className="input-field text-center"
            />

            {error && (
              <p className="text-sm rounded-xl px-3 py-2 mt-3 bg-red-500/15 border border-red-500/30 text-red-300">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {!alreadyJoined && (
        <button
          onClick={handleJoin}
          disabled={busy}
          className="btn-liquid w-full py-4 mt-6 text-base"
        >
          <span>{busy ? 'Joining…' : 'Join Now!'}</span>
        </button>
      )}
    </div>
  )
}
