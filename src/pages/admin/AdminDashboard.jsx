import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    matches24h: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since)

      const { count: depositCount } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending')

      const { count: withdrawCount } = await supabase
        .from('withdraw_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { data: entryFees } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('type', 'entry_fee')

      const totalRevenue = (entryFees || []).reduce((sum, t) => sum + Number(t.amount), 0)

      setStats({
        totalUsers: userCount || 0,
        matches24h: matchCount || 0,
        pendingDeposits: depositCount || 0,
        pendingWithdrawals: withdrawCount || 0,
        totalRevenue,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-mist text-center py-10">Loading dashboard…</p>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Matches (24h)" value={stats.matches24h} />
        <StatCard label="Pending Deposits" value={stats.pendingDeposits} warn={stats.pendingDeposits > 0} />
        <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} warn={stats.pendingWithdrawals > 0} />
      </div>
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
      >
        <p className="text-sm text-white/70">Total Platform Revenue</p>
        <p className="text-3xl font-bold mt-1">৳{stats.totalRevenue}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, warn }) {
  return (
    <div className={`glass rounded-2xl p-4 ${warn ? 'border-yellow-400/40' : ''}`}>
      <p className="text-mist text-xs mb-1">{label}</p>
      <p className="font-bold text-2xl">{value}</p>
    </div>
  )
}
