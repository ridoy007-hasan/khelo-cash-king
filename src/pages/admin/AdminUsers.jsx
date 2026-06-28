import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Users</h2>

      <input
        type="text"
        placeholder="Search by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />

      {loading && <p className="text-mist text-center py-8">Loading…</p>}

      <div className="space-y-2.5">
        {filtered.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-3.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{u.username}</p>
                <p className="text-mist text-xs">{u.phone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">৳{u.wallet_balance}</p>
                <p className="text-mist text-xs">{u.total_matches_played ?? 0} matches</p>
              </div>
            </div>
            <button
              onClick={() => setAdjusting(u)}
              className="btn-glass-outline w-full py-2 text-xs mt-2.5"
            >
              Adjust Balance
            </button>
          </div>
        ))}
        {!loading && filtered.length === 0 && <p className="text-mist text-center py-8">No users found.</p>}
      </div>

      {adjusting && (
        <AdjustBalanceModal
          user={adjusting}
          onClose={() => setAdjusting(null)}
          onDone={() => { setAdjusting(null); load() }}
        />
      )}
    </div>
  )
}

function AdjustBalanceModal({ user, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleAdjust(direction) {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (!reason.trim()) {
      setError('Enter a reason for this adjustment.')
      return
    }
    setBusy(true)
    const delta = direction === 'add' ? amt : -amt
    const newBalance = Number(user.wallet_balance) + delta
    if (newBalance < 0) {
      setError('This would make the balance negative.')
      setBusy(false)
      return
    }
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user.id)
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: direction === 'add' ? 'deposit' : 'withdraw',
      amount: amt,
      status: 'approved',
      admin_note: `Manual adjustment: ${reason}`,
    })
    setBusy(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm glass-strong rounded-3xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Adjust Balance</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">✕</button>
        </div>
        <p className="text-mist text-sm mb-3">{user.username} · Current: ৳{user.wallet_balance}</p>

        <label className="block mb-3">
          <span className="text-xs font-medium text-mist mb-1.5 block">Amount</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
        </label>
        <label className="block mb-4">
          <span className="text-xs font-medium text-mist mb-1.5 block">Reason</span>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Correction for double charge" className="input-field" />
        </label>

        {error && <p className="text-sm rounded-xl px-3 py-2 mb-3 bg-red-500/15 border border-red-500/30 text-red-300">{error}</p>}

        <div className="flex gap-2">
          <button onClick={() => handleAdjust('subtract')} disabled={busy} className="btn-glass-outline flex-1 py-3 text-sm text-red-300">
            − Deduct
          </button>
          <button onClick={() => handleAdjust('add')} disabled={busy} className="btn-liquid flex-1 py-3 text-sm">
            <span>+ Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}
