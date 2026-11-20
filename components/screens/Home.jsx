'use client'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '../../lib/nav.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFeed, nwData, prData, evData } from '../../lib/feed.js'
import { MT, scene, pile, artUri } from '../../lib/art.js'
import { EA, SVC } from '../../lib/constants.js'
import { kycReq, pm, ago } from '../../lib/util.js'
import { Icon } from '../Icons.jsx'

function useSwipe(onMove) {
  const p = useRef(null)
  return {
    onTouchStart: (e) => { p.current = [e.touches[0].clientX, e.touches[0].clientY] },
    onTouchEnd: (e) => {
      if (!p.current) return
      const dx = e.changedTouches[0].clientX - p.current[0], dy = e.changedTouches[0].clientY - p.current[1]
      p.current = null
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) onMove(dx < 0 ? 1 : -1)
    },
  }
}

const bgUrl = (img, k) => (img ? 'url("' + img + '")' : 'url(' + scene(k) + ')')

function Dots({ n, i, set, label }) {
  return (
    <div className="dots">
      {Array.from({ length: n }).map((_, k) => (
        <button key={k} className={k === i ? 'on' : ''} onClick={() => set(k)} aria-label={label + ' ' + (k + 1)} />
      ))}
    </div>
  )
}

export function VerBanner() {
  const nav = useNavigate()
  const { profile, isV, status, kyc, docs } = useAuth()
  if (isV || !profile) return null
  const rq = kycReq(profile, (kyc && kyc.id_type) || 'nid')
  const n = rq.filter((x) => docs.some((d) => d.doc_key === x)).length
  const pend = status === 'pending'
  return (
    <div className="card vban" style={{ margin: '8px 0', borderColor: 'var(--ac)' }}>
      <div className="vbt">
      <div className="big">{pend ? 'Verification under review' : 'Get verified to trade'}</div>
      <div className="sub">{pend ? 'The OreLink team is checking your documents. You can keep browsing.' : 'Browsing is open to everyone. Verify your account to post listings, message sellers and make offers.'}</div>
      {!pend && <div className="sub" style={{ marginTop: 4 }}>{n} of {rq.length} documents uploaded</div>}
      </div>
      <button className={'btn' + (pend ? ' g' : '')} style={{ marginTop: 8 }} onClick={() => nav('/me')}>{pend ? 'View status' : 'Get verified'}</button>
    </div>
  )
}

function News({ feed }) {
  const d = nwData(feed)
  const [i, setI] = useState(0)
  const last = useRef(0)
  const move = (v) => { last.current = Date.now(); setI((x) => (x + v + d.length) % d.length) }
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden || Date.now() - last.current < 12000) return
      setI((x) => (x + 1) % d.length)
    }, 6000)
    return () => clearInterval(t)
  }, [d.length])
  const x = d[i % d.length]
  return (
    <div className="nc" style={{ '--bg': bgUrl(x.img, x.k) }} {...useSwipe(move)}>
      <button className="car l" onClick={() => move(-1)} aria-label="Previous">{'‹'}</button>
      <span className="ntag">{x.tag}</span>
      <div className="nwt">{x.t}</div>
      <div className="nws">{x.b || ''}</div>
      <div className="nwd">{'📅'} {new Date(x.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <span className="nlive"><i />{x.smp ? 'SAMPLE' : 'LATEST'}</span>
      <button className="car r" onClick={() => move(1)} aria-label="Next">{'›'}</button>
      <Dots n={d.length} i={i % d.length} set={(k) => { last.current = Date.now(); setI(k) }} label="News" />
    </div>
  )
}

function Prices({ quotes }) {
  const d = prData(quotes)
  const [i, setI] = useState(0)
  const [info, setInfo] = useState(false)
  const move = (v) => { setInfo(false); setI((x) => (x + v + d.length) % d.length) }
  const x = d[i % d.length], up = x.pct >= 0
  return (
    <>
      <div className="pc" style={{ '--bg': 'url(' + pile(x.k) + ')' }} {...useSwipe(move)}>
        <div className="pst"><i />{x.smp ? 'SAMPLE MARKET' : 'ORELINK REFERENCE'}</div>
        <span className="pbm"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#f0a92b" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>{x.smp ? 'SAMPLE' : 'BENCHMARK'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <div className="pic2"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f0a92b" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg></div>
          <div><div className="pn">{String(x.n).toUpperCase()}</div><div className="pu">{x.u}</div></div>
        </div>
        <div className="pl">{x.smp ? 'ILLUSTRATIVE PRICE' : 'REFERENCE PRICE'} <button onClick={() => setInfo(!info)} aria-label="About this price">i</button></div>
        <div className="pp">${pm(x.p)}</div>
        <div className="pch">
          <span className={up ? 'up' : 'dn'}>{(up ? '↑ +' : '↓ ') + x.pct.toFixed(2)}%</span>
          <span className={up ? 'up' : 'dn'}>{(up ? '+' : '') + pm(x.chg)} (24h)</span>
        </div>
        <div className="pf"><span>{'🕒'} {x.ts ? 'Updated ' + ago(x.ts) + ' ago' : 'Sample values'}</span><span>{x.smp ? 'Source: sample data' : 'Source: OreLink team'}</span></div>
        <button className="car r" onClick={() => move(1)} aria-label="Next price">{'›'}</button>
        <Dots n={d.length} i={i % d.length} set={(k) => { setInfo(false); setI(k) }} label="Price" />
      </div>
      <div className="pbar">
        <span>{'🔄'} {x.smp ? 'Sample values. Not live prices.' : 'Updated when the OreLink team posts prices.'}</span>
        <button onClick={() => setInfo(!info)}>Sources {'ⓘ'}</button>
      </div>
      {info && <div className="pinfo">{x.smp ? 'These are sample figures for the demo. Prices posted by the OreLink team replace them. A live exchange feed can be connected later.' : 'Reference prices posted by the OreLink team. They are not a live exchange feed. Always confirm the price with your buyer or seller.'}</div>}
    </>
  )
}

export function EventCard({ x, onView }) {
  return (
    <div className="evr">
      <div className="edt"><b>{x.d.getDate()}</b><span>{x.d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</span></div>
      <div style={{ minWidth: 0 }}>
        <span className="ntag amb">{x.smp ? 'SAMPLE EVENT' : 'UPCOMING EVENT'}</span>
        <div className="nwt" style={{ margin: '6px 0 0', WebkitLineClamp: 2 }}>{x.t}</div>
      </div>
    </div>
  )
}

function Events({ feed }) {
  const nav = useNavigate()
  const d = evData(feed)
  const [i, setI] = useState(0)
  const move = (v) => setI((x) => (x + v + d.length) % d.length)
  const sw = useSwipe(move)
  if (!d.length) return <div className="note">No upcoming events yet. Check back soon.</div>
  const x = d[i % d.length]
  return (
    <div className="nc" style={{ '--bg': bgUrl(x.img, x.k), minHeight: 176 }} {...sw}>
      <button className="car l" onClick={() => move(-1)} aria-label="Previous">{'‹'}</button>
      <EventCard x={x} />
      <div className="nwd" style={{ marginTop: 8 }}>{'📍'} {(x.place || 'Zimbabwe') + ' · ' + x.d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div className="nws" style={{ marginTop: 4, WebkitLineClamp: 2 }}>{x.b || ''}</div>
      <button className="ebtn" onClick={() => nav('/events')}>View events {'›'}</button>
      <span className="nlive"><i />{x.smp ? 'SAMPLE' : 'SOON'}</span>
      <button className="car r" onClick={() => move(1)} aria-label="Next">{'›'}</button>
      <Dots n={d.length} i={i % d.length} set={setI} label="Event" />
    </div>
  )
}

function Sec({ t, to, ic }) {
  const nav = useNavigate()
  return (
    <div className="row" style={{ margin: '22px 0 8px' }}>
      <span className={'big' + (ic ? ' sech' : '')}>{ic && <Icon name={ic} />}{t}</span>
      <button className="lnk" onClick={() => nav(to)}>See all {'›'}</button>
    </div>
  )
}

export default function Home() {
  const nav = useNavigate()
  const { feed, quotes } = useFeed()
  return (
    <>
      <VerBanner />
      <div className="hh" style={{ backgroundImage: 'linear-gradient(90deg,rgba(9,13,18,.97) 20%,rgba(9,13,18,.6) 55%,rgba(9,13,18,.1)),url(/img/truck.jpg)' }}>
        <div className="hh2">
          <h1>Build Africa{'’'}s<br /><span>Mining Future.</span></h1>
          <p>OreLink connects buyers, sellers, service providers and contractors across the mining industry.</p>
          <button className="gb" onClick={() => nav('/market')}>Explore Marketplace {'→'}</button>
        </div>
      </div>

      <div className="hrow">
        <div>
          <Sec ic="news" t="News" to="/news" />
          <News feed={feed} />
        </div>
        <div>
          <Sec ic="bars" t="Commodity prices" to="/feed" />
          <Prices quotes={quotes} />
        </div>
        <div>
          <Sec ic="cal" t="Upcoming events" to="/events" />
          <Events feed={feed} />
        </div>
      </div>

      <Sec t="Find minerals" to="/market" />
      <div className="grid">
        {MT.map((m) => (
          <button key={m[0]} className="tile" onClick={() => nav('/market?min=' + encodeURIComponent(m[0]))}>
            <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><image href={m[2]} width="160" height="90" preserveAspectRatio="xMidYMid slice" /></svg>
            <b>{m[0]}</b><span>{m[1]}</span>
          </button>
        ))}
      </div>

      <Sec t="Find equipment" to="/equipment" />
      <div className="grid">
        {EA.map((m) => (
          <button key={m[0]} className="tile" onClick={() => nav('/market?eq=' + encodeURIComponent(m[0]))}>
            <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><rect width="160" height="90" fill={m[2]} /><text x="80" y="62" fontSize="44" textAnchor="middle">{m[1]}</text></svg>
            <b>{m[0]}</b><span>Browse listings</span>
          </button>
        ))}
      </div>

      <Sec t="Services and suppliers" to="/services" />
      <div className="grid">
        {SVC.map((c, i) => (
          <button key={c.c} className="tile" onClick={() => nav('/services?cat=' + i)}>
            <img src={artUri('s|' + c.c + '|0|' + (i + 1))} alt="" style={{ width: '100%', aspectRatio: 1.4, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 8 }} />
            <b style={{ fontSize: 15, lineHeight: 1.2 }}>{c.c}</b><span>Browse providers</span>
          </button>
        ))}
      </div>
    </>
  )
}
