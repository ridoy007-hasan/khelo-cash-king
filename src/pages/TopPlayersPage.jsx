import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function TopPlayersPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('username, total_won, total_matches_played')
        .order('total_won', { ascending: false })
        .limit(50)
      setPlayers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <TopBar title="Top Players" subtitle="Leaderboard" onBack={() => navigate('/app/profile')} />

      <div className="px-5 pb-6 space-y-2.5">
        {loading && <p className="text-mist text-center py-10">Loading…</p>}
        {!loading && players.length === 0 && (
          <p className="text-mist text-center py-10">No players yet.</p>
        )}
        {players.map((p, i) => (
          <div key={i} className="glass rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-bold">{medals[i] || `#${i + 1}`}</span>
              <div>
                <p className="font-semibold">{p.username}</p>
                <p className="text-mist text-xs">{p.total_matches_played ?? 0} matches</p>
              </div>
            </div>
            <p className="font-bold text-gold">৳{p.total_won ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
