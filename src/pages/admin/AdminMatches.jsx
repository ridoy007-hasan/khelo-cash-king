import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import EndMatchModal from './EndMatchModal'

const MODE_LABELS = {
  br: 'BR Match',
  clash_squad: 'Clash Squad',
  lone_wolf: 'Lone Wolf',
  cs_1v1_2v2: 'CS 1v1/2v2',
}

export default function AdminMatches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [endingMatch, setEndingMatch] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)
    let query = supabase.from('matches').select('*').order('match_datetime', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setMatches(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filter])

  async function handleCancel(match) {
    if (!confirm(`Cancel match #${match.id.toString().slice(0, 5)}? All entry fees will be refunded.`)) return

    const { data: participants } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', match.id)

    for (const p of participants || []) {
      const { data: prof } = await supabase.from('profiles').select('wallet_balance').eq('id', p.user_id).single()
      if (prof) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: Number(prof.wallet_balance) + Number(match.entry_fee) })
          .eq('id', p.user_id)
        await supabase.from('wallet_transactions').insert({
          user_id: p.user_id,
          type: 'deposit',
          amount: match.entry_fee,
          status: 'approved',
          admin_note: `Refund for cancelled match #${match.id}`,
        })
      }
    }

    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', match.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Manage Matches</h2>
        <button onClick={() => { setEditingMatch(null); setShowForm(true) }} className="btn-liquid px-4 py-2 text-sm">
          <span>+ Create</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['all', 'upcoming', 'live', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize ${
              filter === f ? 'btn-liquid' : 'btn-glass-outline'
            }`}
          >
            {filter === f ? <span>{f}</span> : f}
          </button>
        ))}
      </div>

      {loading && <p className="text-mist text-center py-8">Loading…</p>}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="glass rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{MODE_LABELS[m.game_mode]} · {m.match_type}</p>
                <p className="text-mist text-xs mt-0.5">
                  {new Date(m.match_datetime).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <StatusPill status={m.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <MiniStat label="Slots" value={`${m.filled_slots}/${m.max_slots}`} />
              <MiniStat label="Entry" value={`৳${m.entry_fee}`} />
              <MiniStat label="Win Prize" value={`৳${m.win_prize}`} />
            </div>

            {m.room_id && (
              <p className="text-xs text-mist mb-3">Room: <span className="font-semibold text-white">{m.room_id}</span> / Pass: <span className="font-semibold text-white">{m.room_password}</span></p>
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => navigate(`/app/lobby/${m.id}`)} className="btn-glass-outline px-3 py-2 text-xs flex-1">
                🎮 View Lobby
              </button>
              <button onClick={() => { setEditingMatch(m); setShowForm(true) }} className="btn-glass-outline px-3 py-2 text-xs flex-1">
                ✏️ Edit / Room
              </button>
              {(m.status === 'upcoming' || m.status === 'live') && (
                <>
                  <button onClick={() => setEndingMatch(m)} className="btn-liquid px-3 py-2 text-xs flex-1">
                    <span>🏁 End Match</span>
                  </button>
                  <button onClick={() => handleCancel(m)} className="btn-glass-outline px-3 py-2 text-xs text-red-300">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && matches.length === 0 && <p className="text-mist text-center py-8">No matches found.</p>}
      </div>

      {showForm && (
        <MatchFormModal
          existing={editingMatch}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}

      {endingMatch && (
        <EndMatchModal
          match={endingMatch}
          onClose={() => setEndingMatch(null)}
          onDone={() => { setEndingMatch(null); load() }}
        />
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const styles = {
    upcoming: 'bg-blue-500/20 text-blue-300',
    live: 'bg-green-500/20 text-green-300',
    completed: 'bg-gray-500/20 text-gray-300',
    cancelled: 'bg-red-500/20 text-red-300',
  }
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${styles[status]}`}>{status}</span>
}

function MiniStat({ label, value }) {
  return (
    <div className="glass-strong rounded-xl py-2">
      <p className="text-[9px] text-mist">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  )
}

function MatchFormModal({ existing, onClose, onSaved }) {
  const [gameMode, setGameMode] = useState(existing?.game_mode || 'clash_squad')
  const [matchType, setMatchType] = useState(existing?.match_type || 'Squad')
  const [mapName, setMapName] = useState(existing?.map_name || 'Bermuda')
  const [datetime, setDatetime] = useState(
    existing ? new Date(existing.match_datetime).toISOString().slice(0, 16) : ''
  )
  const [entryFee, setEntryFee] = useState(existing?.entry_fee ?? 40)
  const [winPrize, setWinPrize] = useState(existing?.win_prize ?? 240)
  const [perKill, setPerKill] = useState(existing?.per_kill_prize ?? 0)
  const [maxSlots, setMaxSlots] = useState(existing?.max_slots ?? 8)
  const [roomId, setRoomId] = useState(existing?.room_id || '')
  const [roomPassword, setRoomPassword] = useState(existing?.room_password || '')
  const [rulesNote, setRulesNote] = useState(existing?.rules_note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!datetime) {
      setError('Pick a match date/time.')
      return
    }
    setBusy(true)
    setError('')

    const payload = {
      game_mode: gameMode,
      match_type: matchType,
      map_name: mapName,
      match_datetime: new Date(datetime).toISOString(),
      entry_fee: Number(entryFee),
      win_prize: Number(winPrize),
      per_kill_prize: Number(perKill),
      max_slots: Number(maxSlots),
      room_id: roomId || null,
      room_password: roomPassword || null,
      rules_note: rulesNote || null,
    }

    let res
    if (existing) {
      res = await supabase.from('matches').update(payload).eq('id', existing.id)
    } else {
      res = await supabase.from('matches').insert({ ...payload, status: 'upcoming', filled_slots: 0 })
    }

    setBusy(false)
    if (res.error) {
      setError('Could not save match. ' + res.error.message)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm glass-strong rounded-3xl p-5 max-h-[88vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">{existing ? 'Edit Match' : 'Create Match'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <SelectField label="Game Mode" value={gameMode} onChange={setGameMode} options={[
            ['br', 'BR Match'], ['clash_squad', 'Clash Squad'], ['lone_wolf', 'Lone Wolf'], ['cs_1v1_2v2', 'CS 1v1/2v2'],
          ]} />
          <TextField label="Match Type" value={matchType} onChange={setMatchType} placeholder="Solo / Duo / Squad" />
          <TextField label="Map" value={mapName} onChange={setMapName} placeholder="Bermuda" />
          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Match Date & Time</span>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input-field" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <NumberField label="Entry Fee" value={entryFee} onChange={setEntryFee} />
            <NumberField label="Win Prize" value={winPrize} onChange={setWinPrize} />
            <NumberField label="Per Kill" value={perKill} onChange={setPerKill} />
          </div>
          <NumberField label="Max Slots" value={maxSlots} onChange={setMaxSlots} />
          <TextField label="Room ID (reveal later)" value={roomId} onChange={setRoomId} placeholder="optional" />
          <TextField label="Room Password" value={roomPassword} onChange={setRoomPassword} placeholder="optional" />
          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Rules Note (shown to players, optional)</span>
            <textarea
              value={rulesNote}
              onChange={(e) => setRulesNote(e.target.value)}
              placeholder="e.g. সবাই CS ম্যাচ এর রুলস গুলো ভালোমতো পড়ে জয়েন দিবেন।"
              className="input-field"
              rows={3}
            />
          </label>

          {error && <p className="text-sm rounded-xl px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300">{error}</p>}

          <button type="submit" disabled={busy} className="btn-liquid w-full py-3.5 mt-2">
            <span>{busy ? 'Saving…' : existing ? 'Save Changes' : 'Create Match'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mist mb-1.5 block">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </label>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mist mb-1.5 block">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mist mb-1.5 block">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
        {options.map(([val, lab]) => (
          <option key={val} value={val} className="bg-ink">{lab}</option>
        ))}
      </select>
    </label>
  )
}
