import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  function switchMode(next) {
    if (next === mode) return
    setError('')
    setMode(next)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!phone || phone.length < 8) {
      setError('Enter a valid phone number.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn({ phone, password })
        if (error) {
          setError('Phone number or password is incorrect.')
        } else {
          navigate('/app/play')
        }
      } else {
        if (!fullName.trim()) {
          setError('Enter your full name.')
          setBusy(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          setBusy(false)
          return
        }
        const { error } = await signUp({
          phone,
          password,
          fullName,
          username: username.trim() || phone,
        })
        if (error) {
          setError(error.message?.includes('already')
            ? 'This phone number is already registered.'
            : 'Could not create account. Try again.')
        } else {
          navigate('/app/play')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        background: 'radial-gradient(120% 120% at 20% 0%, #16224A 0%, #0B1426 55%, #060B17 100%)',
      }}
    >
      {/* ambient glow blobs */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6C5CE7, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #2E7BFF, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / brand */}
        <div className="flex flex-col items-center mb-6 select-none">
          <div className="mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Khelo Cash King
          </h1>
          <p className="text-mist text-sm mt-1">Win cash. Every match.</p>
        </div>

        {/* Sliding card container */}
        <div className="relative rounded-3xl glass-strong p-1.5 overflow-hidden">
          {/* Sliding gradient indicator pill behind tabs */}
          <div className="relative grid grid-cols-2 mb-2">
            <div
              className="absolute top-0 bottom-0 w-1/2 rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                background: 'linear-gradient(135deg, #6C5CE7, #2E7BFF)',
                transform: isSignup ? 'translateX(100%)' : 'translateX(0%)',
              }}
            />
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`relative z-10 py-3 rounded-2xl font-semibold text-sm transition-colors duration-300 ${
                !isSignup ? 'text-white' : 'text-mist'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`relative z-10 py-3 rounded-2xl font-semibold text-sm transition-colors duration-300 ${
                isSignup ? 'text-white' : 'text-mist'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form area — slides horizontally between the two forms */}
          <div className="relative overflow-hidden rounded-2xl bg-ink-2/40">
            <div
              className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: isSignup ? 'translateX(-50%)' : 'translateX(0%)' }}
            >
              {/* Sign In form */}
              <div className="w-1/2 px-4 pb-4 pt-3">
                <form onSubmit={mode === 'signin' ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      tabIndex={mode === 'signin' ? 0 : -1}
                    />
                  </Field>
                  <Field label="Password">
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      setShow={setShowPassword}
                      tabIndex={mode === 'signin' ? 0 : -1}
                    />
                  </Field>
                  {mode === 'signin' && error && <ErrorText>{error}</ErrorText>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-liquid w-full py-3.5 mt-2"
                  >
                    <span>{busy ? 'Signing in…' : 'Sign In'}</span>
                  </button>
                  <p className="text-center text-sm text-mist pt-1">
                    New player?{' '}
                    <button type="button" onClick={() => switchMode('signup')} className="text-brand-blue font-semibold">
                      Sign up
                    </button>
                  </p>
                </form>
              </div>

              {/* Sign Up form */}
              <div className="w-1/2 px-4 pb-4 pt-3">
                <form onSubmit={mode === 'signup' ? handleSubmit : (e) => e.preventDefault()} className="space-y-3.5">
                  <Field label="Full Name">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      tabIndex={mode === 'signup' ? 0 : -1}
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      tabIndex={mode === 'signup' ? 0 : -1}
                    />
                  </Field>
                  <Field label="Password">
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      setShow={setShowPassword}
                      tabIndex={mode === 'signup' ? 0 : -1}
                    />
                  </Field>
                  <Field label="Confirm Password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      tabIndex={mode === 'signup' ? 0 : -1}
                    />
                  </Field>
                  {mode === 'signup' && error && <ErrorText>{error}</ErrorText>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-liquid w-full py-3.5 mt-2"
                  >
                    <span>{busy ? 'Creating account…' : 'Create Account'}</span>
                  </button>
                  <p className="text-center text-sm text-mist pt-1">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('signin')} className="text-brand-blue font-semibold">
                      Sign in
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-mist/70 mt-5">
          18+ only. Real-money gaming. Read our <a href="/rules" className="underline">rules</a>.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-mist mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

function PasswordInput({ value, onChange, show, setShow, tabIndex }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder="••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pr-11"
        tabIndex={tabIndex}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-mist text-xs font-medium"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

function ErrorText({ children }) {
  return (
    <p className="text-sm rounded-xl px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300">
      {children}
    </p>
  )
}
