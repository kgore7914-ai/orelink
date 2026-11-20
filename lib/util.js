// Small helpers copied from the prototype.
export function ago(ts) {
  const m = Math.max(0, (Date.now() - (ts || 0)) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return Math.floor(m) + 'm'
  if (m < 1440) return Math.floor(m / 60) + 'h'
  return Math.floor(m / 1440) + 'd'
}

export function pm(v) {
  return (+v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function cleanPh(v) {
  let d = String(v || '').replace(/\D/g, '')
  if (d.indexOf('263') === 0) d = d.slice(3)
  return d.replace(/^0+/, '')
}

export function initials(name) {
  return String(name || '?').split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()
}

// Documents a member must upload, same rules as the prototype.
export function kycReq(profile, idType) {
  const a = ['id_front', 'id_back', 'addr', 'selfie', 'biz1']
  if (idType === 'passport') a.splice(1, 1)
  if (profile && (profile.scope === 'intl' || profile.scope === 'both')) a.push('exp')
  return a
}

export function ts(d) {
  return d ? new Date(d).getTime() : 0
}
