import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function EndMatchModal({ match, onClose, onDone }) {
  const [participants, setParticipants] = useState([])
  const [kills, setKills] = useState({})
  const [winnerId, setWinnerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', match.id)

      const userIds = [...new Set((data || []).map((p) => p.user_id))]
      let profilesById = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, phone')
          .in('id', userIds)
        profilesById = Object.fromEntries((profilesData || []).map((pr) => [pr.id, pr]))
      }

      const withProfiles = (data || []).map((p) => ({ ...p, profiles: profilesById[p.user_id] }))
      setParticipants(withProfiles)
      const initialKills = {}
      for (const p of withProfiles) initialKills[p.id] = p.kills ?? 0
      setKills(initialKills)
      setLoading(false)
    }
    load()
  }, [match.id])

  function computePrize(participantId) {
    const k = Number(kills[participantId] || 0)
    const killPrize = k * Number(match.per_kill_prize)
    const winBonus = winnerId === participantId ? Number(match.win_prize) : 0
    return killPrize + winBonus
  }

  async function handleDistribute() {
    if (!confirm('Distribute prizes and close this match? This cannot be undone.')) return
    setBusy(true)
    setError('')

    try {
      for (const p of participants) {
        const prize = computePrize(p.id)
        const k = Number(kills[p.id] || 0)

        await supabase.from('match_participants').update({
          kills: k,
          prize_won: prize,
        }).eq('id', p.id)

        if (prize > 0) {
          const { data: prof } = await supabase.from('profiles').select('wallet_balance, total_won').eq('id', p.user_id).single()
          if (prof) {
            await supabase.from('profiles').update({
              wallet_balance: Number(prof.wallet_balance) + prize,
              total_won: Number(prof.total_won || 0) + prize,
            }).eq('id', p.user_id)

            await supabase.from('wallet_transactions').insert({
              user_id: p.user_id,
              type: 'prize',
              amount: prize,
              status: 'approved',
              admin_note: `Prize for match #${match.id} (${k} kills${winnerId === p.id ? ', winner' : ''})`,
            })
          }
        }

        await supabase.from('profiles')
          .select('total_matches_played')
          .eq('id', p.user_id)
          .single()
          .then(async ({ data: prof2 }) => {
            if (prof2) {
              await supabase.from('profiles').update({
                total_matches_played: Number(prof2.total_matches_played || 0) + 1,
              }).eq('id', p.user_id)
            }
          })
      }

      await supabase.from('matches').update({ status: 'completed' }).eq('id', match.id)
      onDone()
    } catch (e) {
      setError('Something went wrong while distributing prizes. Please check and retry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm glass-strong rounded-3xl p-5 max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">End Match</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">✕</button>
        </div>

        <p className="text-mist text-sm mb-4">
          Enter kills for each player and mark the winner. Prize = (kills × ৳{match.per_kill_prize}) + win prize for the winner.
        </p>

        {loading && <p className="text-mist text-center py-6">Loading participants…</p>}

        {!loading && participants.length === 0 && (
          <p className="text-mist text-center py-6">No participants joined this match.</p>
        )}

        <div className="space-y-3 mb-4">
          {participants.map((p) => (
            <div key={p.id} className="glass rounded-xl p-3.5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{p.ign || '—'}</p>
                  <p className="text-mist text-xs">{p.profiles?.username} · {p.profiles?.phone}</p>
                </div>
                <button
                  onClick={() => setWinnerId(winnerId === p.id ? '' : p.id)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    winnerId === p.id ? 'bg-gold text-ink' : 'btn-glass-outline'
                  }`}
                >
                  {winnerId === p.id ? '👑 Winner' : 'Mark Winner'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-mist">Kills:</span>
                <input
                  type="number"
                  min="0"
                  value={kills[p.id] ?? 0}
                  onChange={(e) => setKills((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="input-field py-1.5 w-20 text-center"
                />
                <span className="text-xs text-mist ml-auto">Prize: <span className="font-bold text-gold">৳{computePrize(p.id)}</span></span>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm rounded-xl px-3 py-2 mb-3 bg-red-500/15 border border-red-500/30 text-red-300">{error}</p>}

        {participants.length > 0 && (
          <button onClick={handleDistribute} disabled={busy} className="btn-liquid w-full py-3.5">
            <span>{busy ? 'Distributing…' : 'Distribute Prizes & Close Match'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
