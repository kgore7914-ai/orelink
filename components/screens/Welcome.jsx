'use client'
import { useEffect } from 'react'
import { useNavigate } from '../../lib/nav.js'
import { WSVG } from '../../lib/welcomeArt.js'

// Welcome screen before sign-up (prototype welcomePage).
export default function Welcome() {
  const nav = useNavigate()
  useEffect(() => { document.body.classList.add('wel'); return () => document.body.classList.remove('wel') }, [])
  return (
    <main>
      <div className="wl">
        <img className="wl-wm" src="/logo-dark.png" alt="OreLink" />
        <div className="wl-art" dangerouslySetInnerHTML={{ __html: WSVG }} />
        <h1>Connecting Africa{'’'}s mining industry</h1>
        <p>Buy and sell minerals, equipment and services. Create a profile to list, enquire and chat with suppliers.</p>
        <button className="wl-b1" onClick={() => nav('/join?via=wa')}>Create a profile {'→'}</button>
        <button className="wl-b2" onClick={() => nav('/join?via=gmail')}><b style={{ color: '#4285f4', marginRight: 8 }}>G</b>Sign up with Gmail</button>
        <button className="wl-b2" onClick={() => nav('/signin')}>Sign in</button>
      </div>
    </main>
  )
}
