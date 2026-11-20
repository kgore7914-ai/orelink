'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { NW_S, PR_S, EV_S } from './constants.js'

// News, events and prices posted by the OreLink team. Sample cards are
// shown until real ones are posted, exactly like the prototype.
let cache = null
let pending = null
const listeners = new Set()

async function fetchFeed() {
  const [f, q] = await Promise.all([
    supabase.from('feed').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('quotes').select('*').order('sym'),
  ])
  cache = { feed: f.data || [], quotes: q.data || [] }
  listeners.forEach((fn) => fn(cache))
  return cache
}

export function reloadFeed() { pending = fetchFeed(); return pending }

export function useFeed() {
  const [d, setD] = useState(cache || { feed: [], quotes: [] })
  useEffect(() => {
    listeners.add(setD)
    if (!cache && !pending) pending = fetchFeed()
    return () => listeners.delete(setD)
  }, [])
  return d
}

export function mediaUrl(path) {
  if (!path) return ''
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export function nwData(feed) {
  const n = feed.filter((x) => x.type === 'news').slice(0, 7)
  if (n.length) return n.map((x, i) => ({ tag: 'INDUSTRY NEWS', t: x.title, b: x.body, ts: new Date(x.created_at).getTime(), k: i % 4, img: mediaUrl(x.img_path), smp: 0 }))
  return NW_S.map((a, i) => ({ tag: 'SAMPLE NEWS', t: a[0], b: a[1], ts: Date.now() - i * 864e5, k: i % 4, smp: 1 }))
}

export function prData(quotes) {
  if (quotes.length) return quotes.slice(0, 10).map((x) => {
    const nm = String(x.name || x.sym).split(','), k = nm[0].toLowerCase()
    const key = /gold|xau/.test(k + x.sym.toLowerCase()) ? 'gold' : /silver|xag/.test(k) ? 'silver' : /plat/.test(k) ? 'platinum' : /copper/.test(k) ? 'copper' : /nickel/.test(k) ? 'nickel' : /lith/.test(k) ? 'lithium' : /chrom/.test(k) ? 'chrome' : /coal/.test(k) ? 'coal' : /tant/.test(k) ? 'tantalite' : 'gold'
    return { n: nm[0].trim(), u: (nm[1] || '').trim().replace(/^USD per/i, 'USD /'), p: +x.price, pct: +x.pct, chg: +x.chg, k: key, smp: !!x.sample, ts: new Date(x.updated_at).getTime() }
  })
  return PR_S.map((a) => ({ n: a[0], u: a[1], p: a[2], pct: a[3], chg: a[4], k: a[5], smp: 1 }))
}

function evDate(w) {
  const a = String(w || '').split('-')
  return a.length === 3 ? new Date(+a[0], +a[1] - 1, +a[2]) : new Date(w || 0)
}

export function evData(feed) {
  const all = feed.filter((x) => x.type === 'event')
  if (all.length) {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0)
    return all.filter((x) => evDate(x.event_date || x.created_at) >= t0)
      .sort((a, b) => evDate(a.event_date || a.created_at) - evDate(b.event_date || b.created_at))
      .slice(0, 7)
      .map((x, i) => ({ id: x.id, t: x.title, b: x.body, place: x.place, d: evDate(x.event_date || x.created_at), img: mediaUrl(x.img_path), k: [4, 0, 3, 1][i % 4], smp: 0 }))
  }
  return EV_S.map((a, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + [12, 27, 41, 58, 73, 95, 120][i])
    return { t: a[0], b: a[2], place: a[1], d, k: [4, 0, 3, 1][i % 4], smp: 1 }
  })
}
