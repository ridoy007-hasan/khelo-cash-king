import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function ResultsPage() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('match_participants')
        .select('*, matches(*)')
        .eq('user_id', user.id)
        .not('kills', 'is', null)
        .order('joined_at', { ascending: false })
      setResults(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div>
      <TopBar title="Results" subtitle="Your match history" />

      <div className="px-5 pb-6 space-y-3">
        {loading && <p className="text-mist text-center py-10">Loading…</p>}

        {!loading && results.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">📊</p>
            <p className="font-semibold">No results yet</p>
            <p className="text-mist text-sm mt-1">Results appear here after a match you joined ends.</p>
          </div>
        )}

        {results.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold">{r.matches.match_type} · {r.matches.map_name}</p>
                <p className="text-mist text-xs mt-0.5">
                  {new Date(r.matches.match_datetime).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              {r.prize_won > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gold/20 text-gold">🏆 Winner</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-strong rounded-xl py-2 text-center">
                <p className="text-[10px] text-mist">KILLS</p>
                <p className="font-bold">{r.kills}</p>
              </div>
              <div className="glass-strong rounded-xl py-2 text-center">
                <p className="text-[10px] text-mist">PRIZE WON</p>
                <p className="font-bold text-gold">৳{r.prize_won ?? 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
