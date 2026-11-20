'use client'
// Member badge: Verified / Under review / Member (same as the prototype).
export default function Badge({ status }) {
  const cls = status === 'verified' ? 'v' : status === 'pending' ? 'p' : ''
  const txt = status === 'verified' ? '✓ Verified' : status === 'pending' ? 'Under review' : 'Member'
  return <span className={'tag ' + cls}>{txt}</span>
}
