'use client'
import { useRef, useState } from 'react'

// Welcome tour, same slides and look as the prototype.
const IC = {
  gem: <><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M9 3l3 6 3-6M12 21L9 9M12 21l3-12" /></>,
  trade: <path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  ok: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
}
const S = [
  ['gem', 'Welcome to OreLink', 'Zimbabwe’s marketplace for minerals, mines, equipment, fuel and mining services. Here is a quick look around.'],
  ['trade', 'Find it or list it', 'Browse minerals, mines for sale, equipment, fuel and services, or post your own listing or a buyer request.'],
  ['chat', 'Chat, offer and track the deal', 'Message sellers, make offers, and follow every step of the deal on the deal desk.'],
  ['ok', 'Get verified to trade', 'Browsing is open to everyone. Verify your account with your ID, address and licence to post, message and make offers.'],
]

export default function Tour({ onClose }) {
  const [i, setI] = useState(0)
  const x0 = useRef(null)
  const x = S[i], last = i === S.length - 1
  return (
    <div className="tour"
      onTouchStart={(e) => { x0.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (x0.current === null) return
        const dx = e.changedTouches[0].clientX - x0.current; x0.current = null
        if (dx < -50 && i < S.length - 1) setI(i + 1); else if (dx > 50 && i > 0) setI(i - 1)
      }}>
      <button className={'sk' + (last ? ' h' : '')} onClick={onClose}>Skip {'→'}</button>
      <div className="bd0">
        <div className="orb"><svg viewBox="0 0 24 24">{IC[x[0]]}</svg></div>
        <h2>{x[1]}</h2><p>{x[2]}</p>
      </div>
      <div className="dots">{S.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <button className="nx0" onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Get started' : 'Next →'}</button>
    </div>
  )
}
