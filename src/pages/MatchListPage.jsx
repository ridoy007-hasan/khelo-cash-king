import { useEffect, useState, useCallback } from 'react'
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

export default function MatchListPage() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [matches, setMatches] = useState([])
  const [myJoins, setMyJoins] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('game_mode', mode)
      .in('status', ['upcoming', 'live'])
      .order('match_datetime', { ascending: true })

    const matchIds = (matchData || []).map((m) => m.id)
    let countByMatch = {}
    if (matchIds.length > 0) {
      const { data: participantRows } = await supabase
        .from('match_participants')
        .select('match_id')
        .in('match_id', matchIds)
      for (const row of participantRows || []) {
        countByMatch[row.match_id] = (countByMatch[row.match_id] || 0) + 1
      }
    }
    // Use the real participant count rather than the (potentially stale)
    // filled_slots counter column, so the slot count is always accurate.
    const matchesWithCounts = (matchData || []).map((m) => ({
      ...m,
      filled_slots: countByMatch[m.id] || 0,
    }))
    setMatches(matchesWithCounts)

    if (user) {
      const { data: joinData } = await supabase
        .from('match_participants')
        .select('match_id, slot_number')
        .eq('user_id', user.id)
      const joined = {}
      for (const row of joinData || []) joined[row.match_id] = row.slot_number
      setMyJoins(joined)
    }
    setLoading(false)
  }, [mode, user])

  useEffect(() => {
    load()
  }, [load])

  function openMatch(matchId) {
    // Admins go to the full lobby (slot picker, shuffle, auto-register controls).
    // Normal players go to the simple join screen — they don't pick slots.
    navigate(isAdmin ? `/app/lobby/${matchId}` : `/app/join/${matchId}`)
  }

  return (
    <div>
      <TopBar
        title={`${MODE_LABELS[mode] || 'Matches'}`}
        subtitle="Choose a match"
        onBack={() => navigate('/app/play')}
      />

      <div className="px-5 space-y-4 pb-4">
        {loading && <p className="text-mist text-center py-10">Loading matches…</p>}

        {!loading && matches.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-semibold">No matches yet</p>
            <p className="text-mist text-sm mt-1">Check back soon — new matches are added regularly.</p>
          </div>
        )}

        {matches.map((match) => {
          const full = match.filled_slots >= match.max_slots
          const mySlot = myJoins[match.id]
          return (
            <div
              key={match.id}
              onClick={() => openMatch(match.id)}
              className="glass rounded-2xl p-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-bold">
                    {MODE_LABELS[match.game_mode]} ({match.match_type}) {match.map_name && `· ${match.map_name}`}
                  </p>
                  {match.rules_note && (
                    <p className="text-amber-400 text-xs mt-1 leading-relaxed">{match.rules_note}</p>
                  )}
                  <p className="text-mist text-xs mt-1">
                    {new Date(match.match_datetime).toLocaleString('en-BD', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg glass-strong shrink-0 ml-2">#{match.id.toString().slice(0, 5)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3">
                <Stat label="WIN PRIZE" value={`৳${match.win_prize}`} />
                <Stat label="PER KILL" value={`৳${match.per_kill_prize}`} />
                <Stat label="ENTRY FEE" value={`৳${match.entry_fee}`} />
              </div>

              <SlotProgressBar matchType={match.match_type} mapName={match.map_name} filled={match.filled_slots} max={match.max_slots} />

              <div className="flex items-center justify-between mb-3 mt-2">
                <span className="text-mist text-xs">
                  {full ? 'Match full' : `Only ${match.max_slots - match.filled_slots} spots left`}
                </span>
                <span className="text-xs font-semibold">{match.filled_slots}/{match.max_slots}</span>
              </div>

              {mySlot ? (
                <div className="space-y-2 mb-3">
                  <div className="rounded-xl py-2.5 text-center text-sm font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
                    ✓ Joined
                  </div>
                  <RoomDetailsButton match={match} />
                </div>
              ) : (
                <button className="btn-liquid w-full py-3 mb-3 disabled:opacity-40" disabled={full}>
                  <span>{full ? 'Full' : isAdmin ? 'View Lobby & Join' : 'Join'}</span>
                </button>
              )}

              <Countdown targetTime={match.match_datetime} />
            </div>
          )
        })}
      </div>
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

function RoomDetailsButton({ match }) {
  const [open, setOpen] = useState(false)
  const minutesUntilStart = (new Date(match.match_datetime).getTime() - Date.now()) / 60000
  const ready = minutesUntilStart <= 5 && match.room_id

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {!open ? (
        <button
          onClick={() => ready && setOpen(true)}
          disabled={!ready}
          className="btn-glass-outline w-full py-2.5 text-sm disabled:opacity-50"
        >
          {ready ? '🔑 View Room Details' : '🔒 Room details unlock 5 min before start'}
        </button>
      ) : (
        <div className="glass-strong rounded-xl p-3 text-sm space-y-1">
          <p>Room ID: <span className="font-bold">{match.room_id}</span></p>
          <p>Password: <span className="font-bold">{match.room_password || '—'}</span></p>
        </div>
      )}
    </div>
  )
}

function SlotProgressBar({ matchType, mapName, filled = 0, max = 1 }) {
  const pct = Math.min(100, Math.round((filled / max) * 100))
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[11px] text-mist mb-1">
        <span>{matchType || 'Solo'}</span>
        <span>{mapName || ''}</span>
        <span>MOBILE</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #6C5CE7, #2E7BFF)',
          }}
        />
      </div>
    </div>
  )
}
