import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function WithdrawPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState('bKash')
  const [amount, setAmount] = useState('')
  const [receiverNumber, setReceiverNumber] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadHistory()
  }, [user])

  async function loadHistory() {
    if (!user) return
    const { data } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    const balance = profile?.wallet_balance ?? 0

    if (!amt || amt < 50) {
      setError('Minimum withdraw amount is ৳50.')
      return
    }
    if (amt > balance) {
      setError(`You only have ৳${balance} in your wallet.`)
      return
    }
    if (!receiverNumber || receiverNumber.length < 10) {
      setError('Enter the number to receive the money.')
      return
    }

    setBusy(true)
    const { error: insertError } = await supabase.from('withdraw_requests').insert({
      user_id: user.id,
      amount: amt,
      payment_method: method,
      receiver_number: receiverNumber,
      status: 'pending',
    })
    setBusy(false)

    if (insertError) {
      setError('Could not submit request. Try again.')
      return
    }
    setSuccess(true)
    setAmount('')
    setReceiverNumber('')
    loadHistory()
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div>
      <TopBar title="Withdraw" subtitle="Cash out your winnings" showWallet={false} onBack={() => navigate('/app/wallet')} />

      <div className="px-5">
        <div className="glass rounded-2xl p-4 mb-2 flex justify-between items-center">
          <span className="text-mist text-sm">Available Balance</span>
          <span className="font-bold text-lg">৳{profile?.wallet_balance ?? 0}</span>
        </div>
        <p className="text-xs text-mist mb-5 px-1">
          Withdrawals are reviewed and sent manually by admin, usually within 30 minutes.
        </p>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-4 mb-6 space-y-3.5">
          <div>
            <span className="text-xs font-medium text-mist mb-1.5 block">Payment Method</span>
            <div className="grid grid-cols-2 gap-2">
              {['bKash', 'Nagad'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2.5 rounded-xl text-sm font-semibold ${method === m ? 'btn-liquid' : 'btn-glass-outline'}`}
                >
                  {method === m ? <span>{m}</span> : m}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Amount (BDT)</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 200"
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Receiver {method} Number</span>
            <input
              type="tel"
              value={receiverNumber}
              onChange={(e) => setReceiverNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="input-field"
            />
          </label>

          {error && (
            <p className="text-sm rounded-xl px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300">{error}</p>
          )}
          {success && (
            <p className="text-sm rounded-xl px-3 py-2 bg-green-500/15 border border-green-500/30 text-green-300">
              Request submitted! We'll process it shortly.
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-liquid w-full py-3.5">
            <span>{busy ? 'Submitting…' : 'Request Withdraw'}</span>
          </button>
        </form>

        <h3 className="font-bold mb-3">Withdraw History</h3>
        <div className="space-y-2.5 pb-6">
          {history.length === 0 && <p className="text-mist text-sm text-center py-6">No withdraw requests yet.</p>}
          {history.map((wr) => (
            <div key={wr.id} className="glass rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{wr.payment_method} · {wr.receiver_number}</p>
                <p className="text-mist text-xs mt-0.5">
                  {new Date(wr.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">৳{wr.amount}</p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    wr.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300'
                    : wr.status === 'approved' ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {wr.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
