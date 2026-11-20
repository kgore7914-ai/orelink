'use client'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from '../../lib/nav.js'
import { supabase } from '../../lib/supabaseClient.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { DISTRICTS, RSN } from '../../lib/constants.js'
import { cleanPh } from '../../lib/util.js'
import { Logo } from '../Header.jsx'
import OtpInput from '../OtpInput.jsx'
import Countdown from '../Countdown.jsx'
import { startTour } from '../Shell.jsx'
import { USE_EMAIL_CODES } from '../../lib/authMode.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Sign-up wizard, same three steps and wording as the prototype:
// 1 name, 2 contact + code, 3 about you.
export default function Join() {
  const nav = useNavigate()
  const [qs] = useSearchParams()
  const { session, refresh } = useAuth()
  const signedEmail = session && session.user && session.user.email

  const [ob, setOb] = useState(1)
  const [d, setD] = useState({ via: qs.get('via') === 'gmail' ? 'gmail' : 'wa', email: signedEmail || '' })
  const [E, setE] = useState({})
  const [stage, setStage] = useState('')
  const [since, setSince] = useState(0)
  const [codeErr, setCodeErr] = useState('')
  const [rk, setRk] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.body.classList.remove('wel') }, [])
  useEffect(() => { if (signedEmail) setD((x) => ({ ...x, email: signedEmail })) }, [signedEmail])

  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }))
  const top = () => window.scrollTo(0, 0)

  async function sendCode() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email: d.email.trim().toLowerCase(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (error) {
      const m = String(error.message || error)
      setE({ x: /rate limit|security purposes|seconds/i.test(m) ? 'Too many codes were requested. Wait a minute and try again.' : 'Could not send the code: ' + m })
      return false
    }
    setStage('code'); setSince(Date.now()); setCodeErr(''); setRk((x) => x + 1)
    return true
  }

  async function checkCode(code) {
    const { error } = await supabase.auth.verifyOtp({ email: d.email.trim().toLowerCase(), token: code, type: 'email' })
    if (error) { setCodeErr('That code is not right. Check your email and try again.'); setRk((x) => x + 1); return }
    setStage(''); setOb(5); top()
  }

  // Email + password sign-up (no email is sent). Used while USE_EMAIL_CODES is false.
  async function createAccount() {
    const email = d.email.trim().toLowerCase()
    setBusy(true)
    let { data, error } = await supabase.auth.signUp({ email, password: d.pw })
    if (error && /already registered|already exists/i.test(error.message || '')) {
      // Account exists (e.g. sign-up was interrupted): try signing in with the same password.
      const r = await supabase.auth.signInWithPassword({ email, password: d.pw })
      error = r.error; data = r.data
      if (error) error = { message: 'This email already has an account. Go back and choose Sign in.' }
    }
    setBusy(false)
    if (error) {
      const m = String(error.message || error)
      setE({ x: /rate limit|security purposes|seconds/i.test(m) ? 'Too many tries. Wait a minute and try again.' : m })
      return
    }
    if (!data || !data.session) {
      setE({ x: 'Account created, but Supabase wants the email confirmed first. In Supabase turn off Authentication > Sign In / Providers > Email > Confirm email, then sign in.' })
      return
    }
    setOb(5); top()
  }

  async function next() {
    const e = {}
    if (ob === 1) {
      if (!(d.first || '').trim()) e.first = 'First name is required'
      if (!(d.last || '').trim()) e.last = 'Last name is required'
    } else if (ob === 2) {
      if (!EMAIL_RE.test((d.email || '').trim())) e.email = d.via === 'gmail' ? 'Enter a valid Gmail address, like name@gmail.com' : 'Enter a valid email address'
      const ph = cleanPh(d.phone)
      if (d.via === 'wa' && ph.length < 9) e.phone = 'Enter a valid phone number'
      else if (ph.length && ph.length < 9) e.phone = 'Enter a valid phone number or leave it empty'
      if (!USE_EMAIL_CODES && !signedEmail && (d.pw || '').length < 8) e.pw = 'Use at least 8 characters'
    } else if (ob === 5) {
      if (!d.reason) e.reason = 'Choose one option'
      else if (!d.scope) e.scope = 'Choose where you trade'
      if (!d.district || d.district === 'Select district') e.district = 'Select your district'
    }
    setE(e)
    if (Object.keys(e).length) return
    if (ob === 2) {
      // Already signed in with this email (e.g. came back later): no code needed.
      if (signedEmail && signedEmail.toLowerCase() === d.email.trim().toLowerCase()) { setOb(5); top(); return }
      if (USE_EMAIL_CODES) { await sendCode(); return }
      await createAccount(); return
    }
    setOb(ob === 1 ? 2 : ob + 1); top()
  }

  function back() {
    setE({})
    if (ob === 2 && stage === 'code') setStage('')
    else if (ob === 5) setOb(2)
    else setOb(ob - 1)
  }

  async function accept() {
    if (!d.agree) { setE({ agree: 'Please tick the box to continue' }); return }
    const uid = session && session.user && session.user.id
    if (!uid) { setE({ x: 'Your session has ended. Go back and confirm your email again.' }); return }
    setBusy(true)
    const rs = RSN.find((x) => x[0] === d.reason) || RSN[4]
    const ph = cleanPh(d.phone) ? '+263' + cleanPh(d.phone) : null
    const { error } = await supabase.from('profiles').insert({
      id: uid, name: ((d.first || '') + ' ' + (d.last || '')).trim(), first_name: d.first, last_name: d.last,
      role: rs[2], plan: rs[3] || 'Member', district: d.district, reason: d.reason,
      scope: d.scope || 'local', via: d.via === 'gmail' ? 'gmail' : 'wa',
    })
    if (error) { setBusy(false); setE({ x: 'Could not save your profile (' + error.message + ').' }); return }
    await supabase.from('contacts').upsert({ user_id: uid, phone: ph })
    await refresh()
    setBusy(false)
    nav('/', { replace: true }); top(); startTour()
  }

  const fld = (k, label, type) => (
    <>
      <label>{label}</label>
      <input type={type || 'text'} placeholder={label} value={d[k] || ''} onChange={set(k)} style={E[k] ? { borderColor: '#e5534b' } : undefined} />
      {E[k] && <div className="err">{E[k]}</div>}
    </>
  )

  const step = ob === 5 ? 3 : ob
  const gm = d.via === 'gmail'
  const phoneRow = (
    <>
      <label>{gm ? 'WhatsApp number (optional)' : 'Phone number'}</label>
      <div className="row"><span className="tag" style={{ padding: 12 }}>+263</span>
        <input type="tel" placeholder="77 123 4567" value={d.phone || ''} onChange={set('phone')} /></div>
      {E.phone && <div className="err">{E.phone}</div>}
    </>
  )
  const emailRow = (
    <>
      <label>{gm ? 'Gmail address' : 'Email address'}</label>
      <input type="email" inputMode="email" autoComplete="email" placeholder="name@gmail.com" value={d.email || ''}
        onChange={set('email')} disabled={!!signedEmail} />
      {E.email && <div className="err">{E.email}</div>}
      {!USE_EMAIL_CODES && !signedEmail && <>
        <label>Create a password</label>
        <input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={d.pw || ''} onChange={set('pw')} />
        {E.pw && <div className="err">{E.pw}</div>}
      </>}
    </>
  )

  let body
  if (ob === 1) {
    body = <>
      <h2>Create your profile</h2>
      <div className="sub">It takes about a minute. You can browse the marketplace straight away.</div>
      {fld('first', 'First name')}{fld('last', 'Last name')}
      <button className="btn nx" onClick={next}>Next</button>
    </>
  } else if (ob === 2 && stage === 'code') {
    body = <>
      <h2>Enter verification code</h2>
      <div className="sub" style={{ fontSize: 16 }}>Enter the 6-digit code sent by email to <b style={{ color: 'var(--tx)' }}>{d.email}</b>{' '}
        <button className="lnk" onClick={() => setStage('')} aria-label="Edit email">{'✎'}</button></div>
      <OtpInput onComplete={checkCode} resetKey={rk} />
      {codeErr && <div className="err">{codeErr}</div>}
      <div className="sub" style={{ textAlign: 'center', margin: '14px 0' }}>
        Didn{'’'}t get the code? Check your inbox and spam folder or <Countdown since={since} onResend={sendCode} />.
      </div>
    </>
  } else if (ob === 2) {
    body = <>
      <h2>How should we verify you?</h2>
      <div className="row" style={{ gap: 8, margin: '8px 0' }}>
        <button className={'opt' + (gm ? '' : ' on')} style={{ flex: 1, margin: 0 }} onClick={() => setD({ ...d, via: 'wa' })}>WhatsApp</button>
        <button className={'opt' + (gm ? ' on' : '')} style={{ flex: 1, margin: 0 }} onClick={() => setD({ ...d, via: 'gmail' })}>Gmail</button>
      </div>
      {gm ? <>
        <div className="sub">{USE_EMAIL_CODES ? 'We will send a 6-digit code to your Gmail address. ' : 'Sign up with your Gmail address and a password. '}You can also add a WhatsApp number so buyers and sellers can reach you there after you both agree to proceed.</div>
        {emailRow}{phoneRow}
      </> : <>
        <div className="sub">Buyers and sellers reach you on WhatsApp only after you both agree to proceed.</div>
        {phoneRow}
        <div className="note">{USE_EMAIL_CODES ? 'WhatsApp codes are coming soon. For now we send your 6-digit code by email.' : 'WhatsApp codes are coming soon. For now, sign up with your email and a password.'}</div>
        {emailRow}
      </>}
      <button className="btn nx" onClick={next} disabled={busy}>{busy ? (USE_EMAIL_CODES ? 'Sending code...' : 'Creating account...') : 'Next'}</button>
    </>
  } else {
    body = <>
      <h2>About you</h2>
      <div className="sub">Tell us why you are joining so we can show you the right things.</div>
      {RSN.map((x) => <button key={x[0]} className={'opt' + (d.reason === x[0] ? ' on' : '')} onClick={() => setD({ ...d, reason: x[0] })}>{x[1]}</button>)}
      {E.reason && <div className="err">{E.reason}</div>}
      {d.reason && <>
        <h3 style={{ margin: '18px 0 6px' }}>Where do you trade?</h3>
        {[['local', 'Local', 'Within Zimbabwe'], ['intl', 'International', 'Export or import'], ['both', 'Both', 'Local and international']].map((x) => (
          <button key={x[0]} className={'opt' + (d.scope === x[0] ? ' on' : '')} onClick={() => setD({ ...d, scope: x[0] })}><b>{x[1]}</b><div className="sub">{x[2]}</div></button>
        ))}
        {E.scope && <div className="err">{E.scope}</div>}
        {(d.scope === 'intl' || d.scope === 'both') && <div className="legal">International trade needs an export or import permit. We will ask you for it when you verify your account.</div>}
      </>}
      <label>Main district</label>
      <select value={d.district || 'Select district'} onChange={set('district')}>
        {['Select district'].concat(DISTRICTS).map((x) => <option key={x}>{x}</option>)}
      </select>
      {E.district && <div className="err">{E.district}</div>}
      <details style={{ margin: '14px 0 6px' }}>
        <summary className="lnk" style={{ cursor: 'pointer' }}>Read the terms of use</summary>
        <p className="sub"><b>Jurisdiction.</b> Your account is with OreLink and is subject to the laws of Zimbabwe.</p>
        <p className="sub"><b>Risk warning.</b> OreLink only introduces buyers and sellers. It does not guarantee any deal, price, grade or payment. Trading minerals carries risk, including losing money to fraud or disputes. Trade through licensed channels where the law requires, and check everything before you pay.</p>
        <p className="sub"><b>Your details.</b> Your phone number is shared with a trade partner only after you both agree to proceed.</p>
      </details>
      <button className={'opt' + (d.agree ? ' on' : '')} style={{ marginTop: 8 }} onClick={() => setD({ ...d, agree: !d.agree })}>
        {d.agree ? '✓ ' : ''}I am 18 or older and I agree to the terms of use</button>
      {E.agree && <div className="err">{E.agree}</div>}
      <button className="btn nx" onClick={accept} disabled={busy}>{busy ? 'Creating...' : 'Create my profile'}</button>
    </>
  }

  return (
    <>
      <div className="top"><header><div className="brand"><Logo /></div><div className="hr" /></header></div>
      <main>
        <div className="wz">
          <div className="wz-top">
            {ob > 1 ? <button className="wz-bk" onClick={back}>{'←'}</button>
              : <button className="wz-bk" onClick={() => nav('/welcome')}>{'←'}</button>}
            <div className="wz-bar"><i style={{ width: Math.round(step / 3 * 100) + '%' }} /></div>
            <span className="sub">{step}/3</span>
          </div>
          {E.x && <div className="note" style={{ borderColor: '#e5534b', color: '#e5534b' }}>{E.x}</div>}
          {body}
        </div>
      </main>
    </>
  )
}
