'use client'
import { useEffect, useRef } from 'react'

// Six code boxes with paste support and auto-submit, like the prototype.
export default function OtpInput({ onComplete, resetKey }) {
  const refs = useRef([])

  useEffect(() => {
    refs.current.forEach((r) => { if (r) r.value = '' })
    setTimeout(() => refs.current[0] && refs.current[0].focus(), 60)
  }, [resetKey])

  function onInput(i, e) {
    const all = refs.current
    let t = e.target
    const d = t.value.replace(/\D/g, '')
    if (d.length > 1) {
      d.slice(0, all.length - i).split('').forEach((c, k) => { all[i + k].value = c })
      t = all[Math.min(i + d.length, all.length) - 1]
    } else t.value = d
    const nx = all[all.indexOf(t) + 1]
    if (t.value && nx) nx.focus()
    const v = all.map((x) => x.value).join('')
    if (v.length === 6) onComplete(v)
  }

  function onKeyDown(i, e) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs.current[i - 1].focus()
  }

  return (
    <div className="otpw">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} className="otp" type="text" inputMode="numeric"
          autoComplete="one-time-code" maxLength={6} aria-label="Code digit"
          onInput={(e) => onInput(i, e)} onKeyDown={(e) => onKeyDown(i, e)} />
      ))}
    </div>
  )
}
