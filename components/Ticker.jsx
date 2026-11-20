'use client'
import { useNavigate } from '../lib/nav.js'
import { useFeed, prData, evData } from '../lib/feed.js'
import { pm } from '../lib/util.js'

// Scrolling price tape under the header (prototype "tape2").
// New-listing items are added when the marketplace is built.
export default function Ticker() {
  const nav = useNavigate()
  const { feed, quotes } = useFeed()
  const pr = prData(quotes), smp = pr.length && pr[0].smp
  const make = (pre) => {
  const items = pr.map((x, i) => {
    const up = x.pct >= 0
    return (
      <button key={pre + 'p' + i} className="tki" onClick={() => nav('/feed')}>
        <b>{String(x.n).toUpperCase()}</b><span>{pm(x.p)}</span>
        <i className={up ? 'up' : 'dn'}>{(up ? '▲' : '▼') + ' ' + Math.abs(x.pct).toFixed(2)}%</i><em>{x.u}</em>
      </button>
    )
  })
  const ev = evData(feed)[0]
  if (ev) items.push(
    <button key={pre + 'ev'} className="tki" onClick={() => nav('/events')}>
      <b className="nw">EVENT</b><span>{ev.t}</span>
      <em>{(ev.place || '') + ' · ' + ev.d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</em>
    </button>
  )
  return items
  }
  const items = make('a'), dup = make('b')
  return (
    <div className="tape2">
      <span className="tkl">{smp ? 'SAMPLE' : 'PRICES'}</span>
      <div className="tkv"><div className="tkt" style={{ '--tkd': Math.max(40, items.length * 6) + 's' }}>{items}{dup}</div></div>
    </div>
  )
}
