import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function MyMatchesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [joins, setJoins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('match_participants')
        .select('*, matches(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
      setJoins(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const upcoming = joins.filter((j) => j.matches && ['upcoming', 'live'].includes(j.matches.status))
  const completed = joins.filter((j) => j.matches && j.matches.status === 'completed')

  const now = Date.now()

  return (
    <div>
      <TopBar title="My Matches" subtitle="Your joined matches" />

      <div className="px-5 pb-6">
        {loading && <p className="text-mist text-center py-10">Loading…</p>}

        {!loading && joins.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🎮</p>
            <p className="font-semibold">No matches joined yet</p>
            <p className="text-mist text-sm mt-1 mb-4">Head to Play to find a match.</p>
            <button onClick={() => navigate('/app/play')} className="btn-liquid px-6 py-2.5 mx-auto">
              <span>Browse Matches</span>
            </button>
          </div>
        )}

        {upcoming.length > 0 && (
          <>
            <h3 className="font-bold mb-3">Upcoming</h3>
            <div className="space-y-3 mb-6">
              {upcoming.map((j) => {
                const m = j.matches
                const roomReady = new Date(m.match_datetime).getTime() - now < 15 * 60 * 1000
                return (
                  <div key={j.id} className="glass rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{m.match_type} · {m.map_name}</p>
                        <p className="text-mist text-xs mt-0.5">
                          {new Date(m.match_datetime).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-brand-blue/20 text-brand-blue">
                        IGN: {j.ign}
                      </span>
                    </div>

                    {roomReady && m.room_id ? (
                      <div className="glass-strong rounded-xl p-3 text-sm">
                        <p>Room ID: <span className="font-bold">{m.room_id}</span></p>
                        <p>Password: <span className="font-bold">{m.room_password}</span></p>
                      </div>
                    ) : (
                      <p className="text-mist text-xs glass-strong rounded-xl p-3 text-center">
                        🔒 Room details unlock 15 minutes before start
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <h3 className="font-bold mb-3">Completed</h3>
            <div className="space-y-3">
              {completed.map((j) => (
                <div key={j.id} className="glass rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{j.matches.match_type} · {j.matches.map_name}</p>
                    <p className="text-mist text-xs mt-0.5">Kills: {j.kills ?? '—'}</p>
                  </div>
                  <p className="font-bold text-gold">৳{j.prize_won ?? 0}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
