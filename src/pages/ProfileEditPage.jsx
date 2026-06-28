import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function ProfileEditPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState(profile?.username || '')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    await supabase.from('profiles').update({ username, full_name: fullName }).eq('id', user.id)
    await refreshProfile()
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <TopBar title="My Profile" subtitle="Edit your details" showWallet={false} onBack={() => navigate('/app/profile')} />
      <div className="px-5">
        <form onSubmit={handleSave} className="glass rounded-2xl p-4 space-y-3.5">
          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Full Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-mist mb-1.5 block">Phone (cannot change)</span>
            <input value={profile?.phone || ''} disabled className="input-field opacity-50" />
          </label>

          {saved && <p className="text-sm text-green-300">Saved!</p>}

          <button type="submit" disabled={busy} className="btn-liquid w-full py-3.5">
            <span>{busy ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
