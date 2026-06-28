import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TopBar from '../components/TopBar'
import Countdown from '../components/Countdown'

const MODE_LABELS = {
  br: 'BR Match',
  clash_squad: 'Clash Squad',
  lone_wolf: 'Lone Wolf',
  cs_1v1_2v2: 'CS 1v1/2v2',
}

export default function MatchLobbyPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user, profile, isAdmin, refreshProfile } = useAuth()

  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [myJoin, setMyJoin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [ign, setIgn] = useState('')
  const [joinError, setJoinError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [shuffling, setShuffling] = useState(false)
  const [myTrigger, setMyTrigger] = useState(null)
  const [showTriggerForm, setShowTriggerForm] = useState(false)
  const [triggerTargetSlot, setTriggerTargetSlot] = useState('')

  const channelRef = useRef(null)

  const load = useCallback(async () => {
    const { data: matchData } = await supabase.from('matches').select('*').eq('id', matchId).single()
    setMatch(matchData)

    const { data: rawParticipants } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId)
      .order('slot_number', { ascending: true })

    const userIds = [...new Set((rawParticipants || []).map((p) => p.user_id))]
    let profilesById = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)
      profilesById = Object.fromEntries((profilesData || []).map((pr) => [pr.id, pr]))
    }
    const participantData = (rawParticipants || []).map((p) => ({ ...p, profiles: profilesById[p.user_id] }))
    setParticipants(participantData)

    if (user) {
      const mine = participantData.find((p) => p.user_id === user.id)
      setMyJoin(mine || null)

      if (isAdmin) {
        const { data: triggerData } = await supabase
          .from('slot_auto_register')
          .select('*')
          .eq('match_id', matchId)
          .eq('admin_user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle()
        setMyTrigger(triggerData || null)
      }
    }
    setLoading(false)
  }, [matchId, user, isAdmin])

  useEffect(() => {
    load()
  }, [load])

  // Realtime listener — watches for new joins to this match, and fires the
  // admin's auto-register trigger the instant the trigger_slot fills.
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`match_lobby_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_participants', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          await load()
          if (isAdmin && user) {
            await checkAndFireMyTrigger(payload.new.slot_number)
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, isAdmin, user])

  async function checkAndFireMyTrigger(filledSlot) {
    const { data: trigger } = await supabase
      .from('slot_auto_register')
      .select('*')
      .eq('match_id', matchId)
      .eq('admin_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (trigger && trigger.trigger_slot === filledSlot) {
      // Fire: register the admin into target_slot immediately.
      const { error } = await supabase.from('match_participants').insert({
        match_id: matchId,
        user_id: user.id,
        ign: trigger.admin_ign,
        slot_number: trigger.target_slot,
      })
      if (!error) {
        await supabase.from('slot_auto_register').update({ status: 'fulfilled' }).eq('id', trigger.id)
        const { data: freshMatch } = await supabase.from('matches').select('filled_slots').eq('id', matchId).single()
        await supabase.from('matches').update({
          filled_slots: (freshMatch?.filled_slots || 0) + 1,
        }).eq('id', matchId)
        setToast(`Auto-registered into slot ${trigger.target_slot}!`)
        setTimeout(() => setToast(''), 3500)
        await load()
      }
    }
  }

  const maxSlots = match?.max_slots || 0
  const slotArray = Array.from({ length: maxSlots }, (_, i) => i + 1)
  const occupied = {}
  for (const p of participants) {
    if (p.slot_number) occupied[p.slot_number] = p
  }
  const full = participants.length >= maxSlots
  const namesHidden = match?.hide_player_names && !myJoin && !isAdmin

  // Admin can tap any open slot to pick exactly where they join.
  // Normal players just hit "Join" and get the next open slot automatically.
  function openJoinAdminPick(slotNum) {
    setSelectedSlot(slotNum)
    setShowJoinForm(true)
    setJoinError('')
  }

  async function handleJoin() {
    if (!ign.trim()) {
      setJoinError('Enter your Free Fire in-game name.')
      return
    }
    setBusy(true)
    setJoinError('')
    try {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()

      if (!freshProfile || freshProfile.wallet_balance < match.entry_fee) {
        throw new Error('Insufficient balance. Please add money to your wallet.')
      }

      const { error: joinErr } = await supabase.from('match_participants').insert({
        match_id: matchId,
        user_id: user.id,
        ign: ign.trim(),
        slot_number: selectedSlot,
      })
      if (joinErr) {
        if (joinErr.code === '23505') {
          throw new Error('That slot was just taken. Pick another slot.')
        }
        throw new Error('Could not join match. Try again.')
      }

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

      await supabase.from('matches').update({ filled_slots: (match.filled_slots || 0) + 1 }).eq('id', matchId)

      await refreshProfile()
      await load()
      setShowJoinForm(false)
      setToast('Joined! Good luck in the lobby 🎮')
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setJoinError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetTrigger() {
    const target = Number(triggerTargetSlot)
    if (!target || target < 1 || target > maxSlots) {
      setToast('Pick a valid target slot.')
      setTimeout(() => setToast(''), 2500)
      return
    }
    if (occupied[target]) {
      setToast('That slot is already filled.')
      setTimeout(() => setToast(''), 2500)
      return
    }
    const triggerSlot = target - 1
    if (triggerSlot < 1) {
      setToast("Can't watch slot 0 — pick slot 2 or higher.")
      setTimeout(() => setToast(''), 2500)
      return
    }

    await supabase.from('slot_auto_register').upsert({
      match_id: matchId,
      admin_user_id: user.id,
      admin_ign: profile?.username || 'Admin',
      trigger_slot: triggerSlot,
      target_slot: target,
      status: 'pending',
    }, { onConflict: 'match_id,admin_user_id' })

    setShowTriggerForm(false)
    setToast(`Watching slot ${triggerSlot} — you'll auto-join slot ${target} the instant it fills.`)
    setTimeout(() => setToast(''), 4000)
    load()
  }

  async function handleCancelTrigger() {
    if (!myTrigger) return
    await supabase.from('slot_auto_register').delete().eq('id', myTrigger.id)
    setMyTrigger(null)
    setToast('Auto-register trigger cancelled.')
    setTimeout(() => setToast(''), 2500)
  }

  async function handleShuffle() {
    if (!confirm('Shuffle all registered players into Team A / Team B at random? This will reassign slot numbers.')) return
    setShuffling(true)

    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const teamASlots = slotArray.filter((n) => n % 2 === 1)
    const teamBSlots = slotArray.filter((n) => n % 2 === 0)
    const half = Math.ceil(shuffled.length / 2)
    const teamA = shuffled.slice(0, half)
    const teamB = shuffled.slice(half)

    for (let i = 0; i < teamA.length && i < teamASlots.length; i++) {
      await supabase.from('match_participants').update({ slot_number: teamASlots[i] }).eq('id', teamA[i].id)
    }
    for (let i = 0; i < teamB.length && i < teamBSlots.length; i++) {
      await supabase.from('match_participants').update({ slot_number: teamBSlots[i] }).eq('id', teamB[i].id)
    }

    await supabase.from('matches').update({ teams_shuffled: true }).eq('id', matchId)

    // small delay so the "shuffling" animation feels real
    setTimeout(async () => {
      await load()
      setShuffling(false)
      setToast('🎲 Teams shuffled!')
      setTimeout(() => setToast(''), 3000)
    }, 1200)
  }

  async function toggleHideNames() {
    await supabase.from('matches').update({ hide_player_names: !match.hide_player_names }).eq('id', matchId)
    load()
  }

  if (loading) return <p className="text-mist text-center py-16">Loading lobby…</p>
  if (!match) return <p className="text-mist text-center py-16">Match not found.</p>

  return (
    <div>
      <TopBar
        title={`${MODE_LABELS[match.game_mode]} Lobby`}
        subtitle={`#${match.id.toString().slice(0, 5)}`}
        onBack={() => navigate(`/app/matches-list/${match.game_mode}`)}
      />

      <div className="px-5 pb-8 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="WIN PRIZE" value={`৳${match.win_prize}`} />
          <Stat label="PER KILL" value={`৳${match.per_kill_prize}`} />
          <Stat label="ENTRY FEE" value={`৳${match.entry_fee}`} />
        </div>

        <Countdown targetTime={match.match_datetime} />

        {isAdmin && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <p className="font-bold text-sm">🛡️ Admin Controls</p>

            <div className="flex gap-2">
              <button onClick={toggleHideNames} className="btn-glass-outline flex-1 py-2 text-xs">
                {match.hide_player_names ? '👁️ Show Names' : '🙈 Hide Names'}
              </button>
              <button
                onClick={handleShuffle}
                disabled={shuffling || participants.length < 2}
                className="btn-liquid flex-1 py-2 text-xs"
              >
                <span>{shuffling ? '🎲 Shuffling…' : '🎲 Shuffle Teams'}</span>
              </button>
            </div>

            {myTrigger ? (
              <div className="glass-strong rounded-xl p-3 flex items-center justify-between">
                <p className="text-xs text-mist">
                  Watching slot <span className="font-bold text-white">{myTrigger.trigger_slot}</span> → auto-join slot{' '}
                  <span className="font-bold text-white">{myTrigger.target_slot}</span>
                </p>
                <button onClick={handleCancelTrigger} className="text-xs text-red-300 font-semibold ml-2 shrink-0">
                  Cancel
                </button>
              </div>
            ) : !myJoin ? (
              !showTriggerForm ? (
                <button onClick={() => setShowTriggerForm(true)} className="btn-glass-outline w-full py-2 text-xs">
                  ⚡ Auto-register me into a slot
                </button>
              ) : (
                <div className="glass-strong rounded-xl p-3 space-y-2">
                  <p className="text-xs text-mist">
                    Pick the slot you want. The moment the slot just before it fills, you'll be registered instantly.
                  </p>
                  <input
                    type="number"
                    min="2"
                    max={maxSlots}
                    value={triggerTargetSlot}
                    onChange={(e) => setTriggerTargetSlot(e.target.value)}
                    placeholder={`Target slot (2–${maxSlots})`}
                    className="input-field py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowTriggerForm(false)} className="btn-glass-outline flex-1 py-2 text-xs">
                      Cancel
                    </button>
                    <button onClick={handleSetTrigger} className="btn-liquid flex-1 py-2 text-xs">
                      <span>Set Trigger</span>
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">Slots ({participants.length}/{maxSlots})</h3>
            {namesHidden && <span className="text-[10px] text-mist">🙈 Names hidden until you join</span>}
          </div>

          <div className={`grid grid-cols-4 gap-2 transition-opacity ${shuffling ? 'opacity-30' : ''}`}>
            {slotArray.map((slotNum) => {
              const p = occupied[slotNum]
              const isTeamA = slotNum % 2 === 1
              const adminCanPick = isAdmin && !p && !myJoin && !full
              return (
                <div
                  key={slotNum}
                  onClick={() => adminCanPick && openJoinAdminPick(slotNum)}
                  className={`rounded-xl p-2.5 text-center transition-transform ${
                    p
                      ? isTeamA
                        ? 'bg-blue-500/15 border border-blue-500/30'
                        : 'bg-red-500/15 border border-red-500/30'
                      : adminCanPick
                        ? 'glass cursor-pointer active:scale-95'
                        : 'glass opacity-60'
                  }`}
                >
                  <p className="text-[10px] text-mist mb-1">Slot {slotNum}</p>
                  {p ? (
                    <p className="text-xs font-semibold truncate">
                      {namesHidden ? '🔒 Hidden' : p.ign || p.profiles?.username || '—'}
                    </p>
                  ) : (
                    <p className="text-xs text-mist">Open</p>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[11px] text-mist mt-2 text-center">
            🔵 Team A (odd slots) &nbsp;·&nbsp; 🔴 Team B (even slots)
          </p>
        </div>

        {myJoin ? (
          <div className="rounded-xl py-3 text-center text-sm font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
            ✓ You're in slot {myJoin.slot_number} as {myJoin.ign}
          </div>
        ) : isAdmin ? (
          <p className="text-center text-mist text-sm">Tap an open slot above to join at a specific position.</p>
        ) : (
          <button
            onClick={() => navigate(`/app/join/${matchId}`)}
            disabled={full}
            className="btn-liquid w-full py-3.5 disabled:opacity-40"
          >
            <span>{full ? 'Match Full' : 'Join Match'}</span>
          </button>
        )}
      </div>

      {showJoinForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-sm glass-strong rounded-3xl p-5 relative">
            <button
              onClick={() => setShowJoinForm(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full glass flex items-center justify-center text-sm"
            >
              ✕
            </button>
            <h2 className="font-bold text-xl mb-1">Join Slot {selectedSlot}</h2>
            <p className="text-sm text-mist mb-4">
              Entry fee ৳{match.entry_fee} will be deducted from your wallet.
            </p>
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
            {joinError && (
              <p className="text-sm rounded-xl px-3 py-2 mb-3 bg-red-500/15 border border-red-500/30 text-red-300">
                {joinError}
              </p>
            )}
            <button onClick={handleJoin} disabled={busy} className="btn-liquid w-full py-3.5">
              <span>{busy ? 'Joining…' : `Confirm & Pay ৳${match.entry_fee}`}</span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 glass-strong rounded-full px-5 py-2.5 text-sm font-medium z-50 max-w-[90%] text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="glass-strong rounded-xl py-2 text-center">
      <p className="text-[10px] text-mist mb-0.5">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  )
}
