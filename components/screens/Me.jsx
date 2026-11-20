'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { DISTRICTS } from '../../lib/constants.js'
import { applyTheme, saveThemeLocal, lsTheme } from '../../lib/theme.js'
import { cleanPh } from '../../lib/util.js'
import Badge from '../Badge.jsx'

// Profile page (prototype me()): profile form, verification, settings.
export default function Me() {
  const { user, profile, contacts, status, isV, refresh, signOut } = useAuth()
  const [f, setF] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) setF({ name: profile.name, phone: contacts && contacts.phone ? '0' + cleanPh(contacts.phone) : '', role: profile.role, district: profile.district })
  }, [profile, contacts])

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function save() {
    if (!(f.name || '').trim()) { setMsg('Name is required'); return }
    const ph = cleanPh(f.phone)
    if (ph && ph.length < 9) { setMsg('Enter a valid phone number or leave it empty'); return }
    setBusy(true); setMsg('')
    const a = await supabase.from('profiles').update({ name: f.name.trim(), role: f.role, district: f.district }).eq('id', user.id)
    const b = await supabase.from('contacts').upsert({ user_id: user.id, phone: ph ? '+263' + ph : null })
    setBusy(false)
    setMsg(a.error || b.error ? 'Could not save: ' + (a.error || b.error).message : 'Saved ✓')
    refresh()
  }

  const theme = (profile && profile.theme) || lsTheme() || 'dark'
  async function setTheme(v) {
    saveThemeLocal(v); applyTheme(v)
    await supabase.from('profiles').update({ theme: v }).eq('id', user.id)
    refresh()
  }

  if (!profile) return null
  return (
    <div className="pg2">
      <div className="card">
        <div className="row"><span className="big">{profile.name}</span><Badge status={status} /></div>
        <label>Name or company</label><input value={f.name || ''} onChange={set('name')} />
        <label>Phone (WhatsApp)</label><input type="tel" value={f.phone || ''} onChange={set('phone')} placeholder="077 123 4567" />
        <label>Email</label><input value={(user && user.email) || ''} disabled />
        <label>I am a</label>
        <select value={f.role || 'buyer'} onChange={set('role')}>
          <option value="miner">Miner / seller</option><option value="buyer">Buyer</option>
        </select>
        <label>Main district</label>
        <select value={f.district || DISTRICTS[0]} onChange={set('district')}>{DISTRICTS.map((x) => <option key={x}>{x}</option>)}</select>
        {msg && <div className="sub" style={{ marginTop: 8 }}>{msg}</div>}
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button>
      </div>

      {isV ? (
        <div className="card"><div className="big">{'✓'} Verified</div><div className="sub">Congratulations! You have been verified and can now do business on OreLink.</div></div>
      ) : (
        <div className="card">
          <div className="big">Verify your account</div>
          <div className="sub">Upload your documents so the OreLink team can confirm who you are. This protects every buyer and seller. Your documents are used only for verification.</div>
          <div className="steps">{['Identity', 'Address', 'Selfie', 'Business', 'Review'].map((x) => <i key={x}>{x}</i>)}</div>
          <div className="note" style={{ borderColor: 'var(--ac)' }}>Document upload is being built and arrives in the next update.</div>
        </div>
      )}

      <div className="card">
        <div className="big">Settings</div>
        <div className="sub" style={{ marginTop: 2 }}>Appearance</div>
        <div className="thm">
          {[['dark', '🌙 Dark'], ['light', '☀️ Light'], ['system', '📱 Match phone']].map((x) => (
            <button key={x[0]} className={theme === x[0] ? 'on' : ''} onClick={() => setTheme(x[0])}>{x[1]}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="big">Account</div>
        <div className="sub">Signed in as {user && user.email}</div>
        <button className="btn g" onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}
