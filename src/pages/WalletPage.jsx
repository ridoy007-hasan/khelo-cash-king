import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

const ADMIN_NUMBERS = {
  bKash: '01780825919',
  Nagad: '01780825919',
}

export default function WalletPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [method, setMethod] = useState('bKash')
  const [amount, setAmount] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [trxId, setTrxId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadHistory()
  }, [user])

  async function loadHistory() {
    if (!user) return
    const { data } = await supabase
      .from('wallet_transactions')
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
    if (!amt || amt < 50) {
      setError('Minimum deposit amount is ৳50.')
      return
    }
    if (!senderNumber || senderNumber.length < 10) {
      setError('Enter the phone number you sent money from.')
      return
    }
    if (!trxId.trim()) {
      setError('Enter the Transaction ID (TrxID).')
      return
    }
    setBusy(true)
    const { error: insertError } = await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: amt,
      status: 'pending',
      payment_method: method,
      sender_number: senderNumber,
      transaction_id: trxId.trim(),
    })
    setBusy(false)
    if (insertError) {
      setError('Could not submit request. Try again.')
      return
    }
    setShowForm(false)
    setAmount('')
    setSenderNumber('')
    setTrxId('')
    loadHistory()
  }

  return (
    <div>
      <TopBar title="Wallet" subtitle="Manage your balance" showWallet={false} onBack={() => navigate('/app/profile')} />

      <div className="px-5">
        <div
          className="rounded-3xl p-6 mb-5 text-center"
          style={{ background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)' }}
        >
          <p className="text-sm text-white/70 mb-1">Current Balance</p>
          <p className="text-4xl font-bold">৳{profile?.wallet_balance ?? 0}</p>
        </div>

        {!showForm ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setShowForm(true)} className="btn-liquid py-3.5">
              <span>+ Add Money</span>
            </button>
            <button onClick={() => navigate('/app/withdraw')} className="btn-glass-outline py-3.5">
              Withdraw
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-4 mb-6 space-y-3.5">
            <h3 className="font-bold mb-1">Add Money</h3>

            <div>
              <span className="text-xs font-medium text-mist mb-1.5 block">Payment Method</span>
              <div className="grid grid-cols-2 gap-2">
                {['bKash', 'Nagad'].map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      method === m ? 'btn-liquid' : 'btn-glass-outline'
                    }`}
                  >
                    {method === m ? <span>{m}</span> : m}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-mist glass-strong rounded-xl px-3 py-2.5">
              Send money to <span className="font-bold text-white">{ADMIN_NUMBERS[method]}</span> ({method}), then fill in the details below.
            </p>

            <label className="block">
              <span className="text-xs font-medium text-mist mb-1.5 block">Amount (BDT)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="input-field"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-mist mb-1.5 block">Your {method} Number</span>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="input-field"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-mist mb-1.5 block">Transaction ID (TrxID)</span>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="e.g. 8N7K2X9P"
                className="input-field"
              />
            </label>

            {error && (
              <p className="text-sm rounded-xl px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-glass-outline flex-1 py-3">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-liquid flex-1 py-3">
                <span>{busy ? 'Submitting…' : 'Submit'}</span>
              </button>
            </div>
          </form>
        )}

        <h3 className="font-bold mb-3">Transaction History</h3>
        <div className="space-y-2.5 pb-6">
          {history.length === 0 && <p className="text-mist text-sm text-center py-6">No transactions yet.</p>}
          {history.map((tx) => (
            <div key={tx.id} className="glass rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                <p className="text-mist text-xs mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                  {tx.payment_method && ` · ${tx.payment_method}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">৳{tx.amount}</p>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    approved: 'bg-green-500/20 text-green-300',
    rejected: 'bg-red-500/20 text-red-300',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${styles[status] || ''}`}>
      {status}
    </span>
  )
}
