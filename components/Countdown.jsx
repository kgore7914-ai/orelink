'use client'
import { useEffect, useState } from 'react'

// "resend code (45s)" then a Resend button, like the prototype.
export default function Countdown({ since, onResend }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  const s = Math.max(0, 45 - Math.floor((Date.now() - since) / 1000))
  if (s > 0) return <span>resend code ({s}s)</span>
  return <button className="lnk" onClick={onResend}>Resend code</button>
}
