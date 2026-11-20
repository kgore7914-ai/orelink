'use client'
import { useLocation, useNavigate } from '../lib/nav.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './Icons.jsx'
import { Logo } from './Header.jsx'
import Badge from './Badge.jsx'

// Laptop/desktop sidebar (hidden on phones by styles/desktop.css).
// Same destinations as the bottom bar and the side menu.
export default function Sidebar({ onTour }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { profile, status, isAdmin } = useAuth()
  const p = profile || {}

  const It = ({ to, ic, t, on }) => (
    <button className={'sb-it' + (on ? ' on' : '')} onClick={() => nav(to)}><Icon name={ic} />{t}</button>
  )

  return (
    <aside className="sb">
      <button onClick={() => nav('/')} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left' }} aria-label="Home">
        <Logo className="sb-wm" />
      </button>
      <It to="/" ic="home" t="Home" on={pathname === '/'} />
      <It to="/market" ic="market" t="Marketplace" on={pathname.startsWith('/market')} />
      <It to="/chats" ic="chat" t="Chats" on={pathname.startsWith('/chats')} />
      <It to="/dash" ic="dash" t="Dashboard" on={pathname.startsWith('/dash')} />
      <It to="/events" ic="events" t="Events" on={pathname === '/events'} />

      <div className="sb-sec">Discover</div>
      <It to="/news" ic="news" t="News" on={pathname === '/news'} />
      <It to="/feed" ic="bars" t="Prices and feed" on={pathname === '/feed'} />
      <It to="/services" ic="tools" t="Services" on={pathname === '/services'} />
      <It to="/sub" ic="card" t="Subscription" on={pathname === '/sub'} />

      <div className="sb-sec">More</div>
      <It to="/help" ic="help" t="Help and support" on={pathname === '/help'} />
      <It to="/me" ic="gear" t="Settings and privacy" on={pathname === '/me'} />
      <button className="sb-it" onClick={onTour}><Icon name="tour" />App tour</button>
      <It to="/about" ic="info" t="About us" on={pathname === '/about'} />
      <It to="/terms" ic="doc" t="Terms of use" on={pathname === '/terms'} />
      {isAdmin && <It to="/admin" ic="shield" t="Admin review" on={pathname === '/admin'} />}

      <div className="sb-gap" />
      <button className="sb-me" onClick={() => nav('/me')}>
        <span className="av">{(p.name || '?').charAt(0).toUpperCase()}</span>
        <span style={{ minWidth: 0 }}><b>{p.name || 'Member'}</b><Badge status={status} /></span>
      </button>
    </aside>
  )
}
