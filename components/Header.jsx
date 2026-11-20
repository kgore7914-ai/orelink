'use client'
import { useNavigate } from '../lib/nav.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './Icons.jsx'
import Ticker from './Ticker.jsx'
import { initials } from '../lib/util.js'

export function Logo({ className }) {
  const light = document.documentElement.getAttribute('data-theme') === 'light'
  return <img className={className || 'wm'} src={light ? '/logo-light.png' : '/logo-dark.png'} alt="OreLink" />
}

// Top bar: menu, logo, search, alerts, avatar, then the price tape.
// minimal = logo only (used during sign-up), like the prototype.
export default function Header({ minimal, onMenu, notifCount }) {
  const nav = useNavigate()
  const { profile } = useAuth()
  const nb = notifCount || 0
  return (
    <div className="top">
      <header>
        {!minimal && (
          <button className="burger" aria-label="Menu" onClick={onMenu}><Icon name="burger" /></button>
        )}
        <div className="brand"><Logo /></div>
        {!minimal && (
          <button className="hsrch" onClick={() => nav('/market?focus=1')}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            Search minerals, equipment and services
          </button>
        )}
        <div className="hr">
          {!minimal && (
            <>
              <button className="hb srch" aria-label="Search" onClick={() => nav('/market?focus=1')}><Icon name="search" /></button>
              <button className="hb" aria-label="Alerts" onClick={() => nav('/notifications')}>
                <Icon name="bell" />{nb > 0 && <i className="bd2">{nb > 9 ? '9+' : nb}</i>}
              </button>
              <button className="avh" aria-label="Profile" onClick={() => nav('/me')}>{initials(profile && profile.name)}</button>
            </>
          )}
        </div>
      </header>
      {!minimal && <Ticker />}
    </div>
  )
}
