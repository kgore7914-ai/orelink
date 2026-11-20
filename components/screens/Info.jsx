'use client'
import { useNavigate } from '../../lib/nav.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFeed, evData, mediaUrl } from '../../lib/feed.js'

// Simple pages copied from the prototype.
export function BackHome() {
  const nav = useNavigate()
  return <button className="lnk" onClick={() => nav('/')}>{'←'} Home</button>
}

export function About() {
  return <div className="pgn">
    <h2 style={{ margin: '10px 0' }}>About us</h2>
    <div className="card">
      <p>OreLink is a marketplace for Zimbabwe{'’'}s mining trade. It connects miners, buyers, equipment suppliers and service providers in one place.</p>
      <p>Members are verified by our team before they can list, buy or chat, so you know who you are dealing with.</p>
      <p className="sub">OreLink introduces parties and does not guarantee any deal. Trade through licensed channels where the law requires.</p>
    </div>
  </div>
}

const HELP = [
  ['How do I get verified?', 'Complete your profile, then open Profile and follow Step 2. Pay the fee, and bring your ID and mining or dealer documents for a quick check by our team.'],
  ['When can I use WhatsApp?', 'After you and the other person both tap Agree to proceed in the chat, WhatsApp unlocks.'],
  ['Is my information safe?', 'Your sensitive details stay private. Your phone number is shared with a trade partner only after you both agree to proceed.'],
  ['I think someone is a scammer', 'Open their profile and tap Report this member. Our team reviews every report.'],
]
export function Help() {
  return <div className="pgn">
    <h2 style={{ margin: '10px 0' }}>Help and support</h2>
    {HELP.map((x) => <details key={x[0]} className="card"><summary><b>{x[0]}</b></summary><p className="sub">{x[1]}</p></details>)}
  </div>
}

export function Terms() {
  return <div className="pgn">
    <h2 style={{ margin: '10px 0' }}>Terms of use</h2>
    <div className="card">
      <b>Jurisdiction and choice of law</b>
      <p className="sub">Your account is with OreLink and is subject to the laws of Zimbabwe.</p>
      <b>Risk warning</b>
      <p className="sub">OreLink only introduces buyers and sellers. It does not guarantee any deal, price, grade or payment. Trading minerals carries risk, including losing money to fraud or disputes. Trade through licensed channels where the law requires, and check everything before you pay.</p>
      <b>Your details</b>
      <p className="sub">Your phone number is shared with a trade partner only after you both agree to proceed.</p>
    </div>
  </div>
}

function Pk({ n, pr, ds, on, soon }) {
  return (
    <div className={'pk' + (on ? ' on' : '') + (soon ? ' soon' : '')}>
      <span className="rd" />
      <span><b>{n}</b> <span className="sub">{pr}</span>{ds && <div className="sub">{ds}</div>}</span>
      {soon && <span className="tag">Coming soon</span>}
    </div>
  )
}
export function Subscription() {
  const nav = useNavigate()
  const { profile, isV } = useAuth()
  return <div className="pgn">
    <h2 style={{ margin: '10px 0 4px' }}>Subscription</h2>
    <div className="sub" style={{ marginBottom: 10 }}>Your package depends on how you joined OreLink.</div>
    <Pk n={((profile && profile.plan) || 'Member') + ' registration'} pr="USD 10" ds="One-off fee. Verification badge, listing, buying and chat." on />
    <Pk n="Plus" pr="USD 25" soon />
    <Pk n="Pro" pr="USD 100" soon />
    {isV ? <div className="note">{'✅'} Your registration is active.</div> : <button className="btn" onClick={() => nav('/me')}>Pay and get verified</button>}
  </div>
}

export function Notifications() {
  return <div className="pgn">
    <h2 style={{ margin: '10px 0' }}>Notifications</h2>
    <div className="note">No notifications yet. Enquiries about your listings, new messages and verification updates will appear here.</div>
  </div>
}

export function News() {
  const { feed } = useFeed()
  const { isAdmin } = useAuth()
  const n = feed.filter((x) => x.type === 'news')
  return <div className="pgn">
    <BackHome />
    <h2 style={{ margin: '10px 0' }}>News</h2>
    {isAdmin && <div className="note">Posting news from the app arrives with the admin tools update.</div>}
    {n.length ? n.map((x) => (
      <div className="card" key={x.id}>
        {x.img_path && <img className="ph" src={mediaUrl(x.img_path)} alt="" />}
        <div className="row"><span className="big">{x.title}</span><span className="sub">{new Date(x.created_at).toLocaleDateString()}</span></div>
        <div>{x.body}</div>
      </div>
    )) : <div className="note">No news yet.</div>}
  </div>
}

export function Events() {
  const { feed } = useFeed()
  const d = evData(feed)
  return <div className="pgn">
    <h2 style={{ margin: '10px 0' }}>Events</h2>
    <div className="sub">Mining expos, trade fairs, workshops and meetups across Zimbabwe.</div>
    {d.length ? d.map((x, i) => (
      <div className="card" key={x.id || i}>
        <div className="evr">
          <div className="edt"><b>{x.d.getDate()}</b><span>{x.d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</span></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span className="ntag amb">{x.smp ? 'SAMPLE EVENT' : 'UPCOMING EVENT'}</span>
            <div className="big" style={{ marginTop: 6 }}>{x.t}</div>
            <div className="sub">{'📍'} {(x.place || 'Zimbabwe') + ' · ' + x.d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
            {x.img && <img className="ph" style={{ marginTop: 8 }} src={x.img} alt="" />}
            <div style={{ marginTop: 6 }}>{x.b || ''}</div>
          </div>
        </div>
      </div>
    )) : <div className="note">No upcoming events yet. Check back soon.</div>}
  </div>
}

export function ComingSoon({ title }) {
  return <div className="pgn">
    <BackHome />
    <h2 style={{ margin: '10px 0' }}>{title}</h2>
    <div className="note">This part of OreLink is being built. It arrives in a coming update.</div>
  </div>
}
