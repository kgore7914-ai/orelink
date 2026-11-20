'use client'
import { useEffect, useState } from 'react'
import Header from './Header.jsx'
import BottomNav from './BottomNav.jsx'
import Drawer from './Drawer.jsx'
import Tour from './Tour.jsx'
import Sidebar from './Sidebar.jsx'

// The signed-in app frame: header + price tape, page, bottom bar, menu.
export default function Shell({ children }) {
  const [drw, setDrw] = useState(false)
  const [tour, setTour] = useState(false)

  useEffect(() => {
    document.body.classList.remove('wel')
    document.body.classList.add('app')
    const t = () => setTour(true)
    window.addEventListener('ol:tour', t)
    return () => { window.removeEventListener('ol:tour', t); document.body.classList.remove('app') }
  }, [])

  return (
    <>
      <Sidebar onTour={() => setTour(true)} />
      <Header onMenu={() => setDrw(true)} />
      <BottomNav />
      <main>
        {children}
        <Drawer open={drw} onClose={() => setDrw(false)} onTour={() => setTour(true)} />
      </main>
      {tour && <Tour onClose={() => setTour(false)} />}
    </>
  )
}

export function startTour() {
  setTimeout(() => window.dispatchEvent(new Event('ol:tour')), 250)
}
