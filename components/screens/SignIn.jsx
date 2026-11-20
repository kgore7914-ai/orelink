'use client'
import { useEffect, useState } from 'react'
import { useNavigate } from '../../lib/nav.js'
import { supabase } from '../../lib/supabaseClient.js'
import OtpInput from '../OtpInput.jsx'
import Countdown from '../Countdown.jsx'
import { USE_EMAIL_CODES } from '../../lib/authMode.js'

function friendly(err) {
  const m = String((err && err.message) || err || '')
  if (/not allowed|signup|not found/i.test(m)) return 'We could not find an OreLink profile for this account yet. Create a profile to join.'
  if (/rate limit|security purposes|seconds/i.test(m)) return 'Too many codes were requested. Wait a minute and try again.'
  return 'Something went wrong: ' + m
}

// Sign in, styled like the prototype's "Welcome back" lock screen.
// After the code is accepted the app opens automatically.
export default function SignIn() {
  const nav = useNavigate()
  const [stage, setStage] = useState('id')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [since, setSince] = useState(0)
  const [busy, setBusy] = useState(false)
  const [rk, setRk] = useState(0)
  const [pw, setPw] = useState('')

  useEffect(() => { document.body.classList.add('wel'); return () => document.body.classList.remove('wel') }, [])

  // Email + password sign-in (no email is sent). Used while USE_EMAIL_CODES is false.
  async function login() {
    const e = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Enter the email you signed up with.'); return }
    if (!pw) { setErr('Enter your password.'); return }
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: pw })
    setBusy(false)
    if (!error) return // the app opens automatically
    const m = String(error.message || error)
    if (/invalid login|credentials/i.test(m)) setErr('Email or password is not right. If you signed up with an email link before, create a profile again with a password.')
    else if (/not confirmed/i.test(m)) setErr('This email is not confirmed. In Supabase turn off Authentication > Sign In / Providers > Email > Confirm email.')
    else setErr(friendly(error))
  }

  async function send() {
    const e = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Enter the email you signed up with.'); return }
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false } })
    setBusy(false)
    if (error) { setErr(friendly(error)); return }
    setEmail(e); setStage('code'); setSince(Date.now()); setRk((x) => x + 1)
  }

  async function check(code) {
    setErr('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) { setErr('That code is not right. Check your email and try again.'); setRk((x) => x + 1) }
  }

  const mask = email.replace(/^(.).*(@.*)$/, '$1•••$2')

  return (
    <main>
      {stage === 'code' ? (
        <div className="wl lk">
          <img className="wl-wm" src="/logo-dark.png" alt="OreLink" />
          <h1>Check your email</h1>
          <p>Enter the 6-digit code sent to<br /><b style={{ color: '#f2f4f7' }}>{mask}</b></p>
          <OtpInput onComplete={check} resetKey={rk} />
          {err && <div className="wl-msg">{err}</div>}
          <p style={{ textAlign: 'center', margin: '14px 0' }}>
            Didn{'’'}t get the code? Check your spam folder or <Countdown since={since} onResend={send} />.
          </p>
          <div className="wl-sep">or</div>
          <button className="wl-b2" onClick={() => { setStage('id'); setErr('') }}>Back</button>
        </div>
      ) : (
        <div className="wl lk">
          <img className="wl-wm" src="/logo-dark.png" alt="OreLink" />
          <h1>Welcome back</h1>
          <p>Confirm it is you to continue.</p>
          <input className="lkin" type="email" inputMode="email" placeholder="Email address" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (USE_EMAIL_CODES ? send() : login())} />
          {!USE_EMAIL_CODES && (
            <input className="lkin" type="password" placeholder="Password" autoComplete="current-password"
              value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} />
          )}
          {err && <div className="wl-msg" style={{ margin: '0 0 12px' }}>{err}</div>}
          <button className="wl-b1" onClick={USE_EMAIL_CODES ? send : login} disabled={busy}>{busy ? (USE_EMAIL_CODES ? 'Sending code...' : 'Signing in...') : 'Log in'}</button>
          <div className="wl-sep">or</div>
          <button className="wl-b2" onClick={() => nav('/welcome')}>Create a profile</button>
        </div>
      )}
    </main>
  )
}
