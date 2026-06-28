import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPayouts() {
  const [tab, setTab] = useState('deposits')
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    const { data: depositData, error: depositErr } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('type', 'deposit')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const { data: withdrawData, error: withdrawErr } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Fetch profile info separately and attach it manually — avoids any
    // issue with embedded joins silently returning empty results.
    const userIds = [
      ...new Set([...(depositData || []).map((d) => d.user_id), ...(withdrawData || []).map((w) => w.user_id)]),
    ]
    let profilesById = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, phone')
        .in('id', userIds)
      profilesById = Object.fromEntries((profilesData || []).map((p) => [p.id, p]))
    }

    setDeposits((depositData || []).map((d) => ({ ...d, profiles: profilesById[d.user_id] })))
    setWithdrawals((withdrawData || []).map((w) => ({ ...w, profiles: profilesById[w.user_id] })))

    if (depositErr) console.error('deposit load error', depositErr)
    if (withdrawErr) console.error('withdraw load error', withdrawErr)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function approveDeposit(tx) {
    setBusyId(tx.id)
    const { data: prof } = await supabase.from('profiles').select('wallet_balance').eq('id', tx.user_id).single()
    if (prof) {
      await supabase.from('profiles').update({
        wallet_balance: Number(prof.wallet_balance) + Number(tx.amount),
      }).eq('id', tx.user_id)
    }
    await supabase.from('wallet_transactions').update({ status: 'approved' }).eq('id', tx.id)
    await load()
    setBusyId(null)
  }

  async function rejectDeposit(tx) {
    setBusyId(tx.id)
    await supabase.from('wallet_transactions').update({ status: 'rejected', admin_note: 'Rejected by admin' }).eq('id', tx.id)
    await load()
    setBusyId(null)
  }

  async function approveWithdraw(wr) {
    setBusyId(wr.id)
    const { data: prof } = await supabase.from('profiles').select('wallet_balance').eq('id', wr.user_id).single()
    if (!prof || Number(prof.wallet_balance) < Number(wr.amount)) {
      alert('User has insufficient balance for this withdrawal.')
      setBusyId(null)
      return
    }
    await supabase.from('profiles').update({
      wallet_balance: Number(prof.wallet_balance) - Number(wr.amount),
    }).eq('id', wr.user_id)
    await supabase.from('withdraw_requests').update({ status: 'approved' }).eq('id', wr.id)
    await supabase.from('wallet_transactions').insert({
      user_id: wr.user_id,
      type: 'withdraw',
      amount: wr.amount,
      status: 'approved',
      payment_method: wr.payment_method,
      admin_note: `Withdrawal sent to ${wr.receiver_number}`,
    })
    await load()
    setBusyId(null)
  }

  async function rejectWithdraw(wr) {
    setBusyId(wr.id)
    await supabase.from('withdraw_requests').update({ status: 'rejected', admin_note: 'Rejected by admin' }).eq('id', wr.id)
    await load()
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Payouts</h2>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab('deposits')}
          className={`py-2.5 rounded-xl text-sm font-semibold ${tab === 'deposits' ? 'btn-liquid' : 'btn-glass-outline'}`}
        >
          {tab === 'deposits' ? <span>Deposits ({deposits.length})</span> : `Deposits (${deposits.length})`}
        </button>
        <button
          onClick={() => setTab('withdrawals')}
          className={`py-2.5 rounded-xl text-sm font-semibold ${tab === 'withdrawals' ? 'btn-liquid' : 'btn-glass-outline'}`}
        >
          {tab === 'withdrawals' ? <span>Withdrawals ({withdrawals.length})</span> : `Withdrawals (${withdrawals.length})`}
        </button>
      </div>

      {loading && <p className="text-mist text-center py-8">Loading…</p>}

      {!loading && tab === 'deposits' && (
        <div className="space-y-3">
          {deposits.length === 0 && <p className="text-mist text-center py-8">No pending deposits.</p>}
          {deposits.map((tx) => (
            <div key={tx.id} className="glass rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{tx.profiles?.username}</p>
                  <p className="text-mist text-xs">{tx.profiles?.phone}</p>
                </div>
                <p className="font-bold text-lg">৳{tx.amount}</p>
              </div>
              <p className="text-xs text-mist mb-3">
                {tx.payment_method} · Sent from {tx.sender_number} · TrxID: <span className="font-mono">{tx.transaction_id}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => rejectDeposit(tx)} disabled={busyId === tx.id} className="btn-glass-outline flex-1 py-2 text-sm text-red-300">
                  Reject
                </button>
                <button onClick={() => approveDeposit(tx)} disabled={busyId === tx.id} className="btn-liquid flex-1 py-2 text-sm">
                  <span>{busyId === tx.id ? '...' : 'Approve'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'withdrawals' && (
        <div className="space-y-3">
          {withdrawals.length === 0 && <p className="text-mist text-center py-8">No pending withdrawals.</p>}
          {withdrawals.map((wr) => (
            <div key={wr.id} className="glass rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{wr.profiles?.username}</p>
                  <p className="text-mist text-xs">{wr.profiles?.phone}</p>
                </div>
                <p className="font-bold text-lg">৳{wr.amount}</p>
              </div>
              <p className="text-xs text-mist mb-3">
                Send via {wr.payment_method} to <span className="font-semibold text-white">{wr.receiver_number}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => rejectWithdraw(wr)} disabled={busyId === wr.id} className="btn-glass-outline flex-1 py-2 text-sm text-red-300">
                  Reject
                </button>
                <button onClick={() => approveWithdraw(wr)} disabled={busyId === wr.id} className="btn-liquid flex-1 py-2 text-sm">
                  <span>{busyId === wr.id ? '...' : 'Approve'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
