'use client'
import { useLocation, useNavigate } from '../lib/nav.js'
import { Icon } from './Icons.jsx'

const HOME_PAGES = ['/', '/news', '/feed', '/prices', '/minerals', '/equipment', '/services', '/seller']

// Bottom bar, same order and behaviour as the prototype's navBar().
export default function BottomNav({ unread }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const onMarket = pathname.startsWith('/market')
  const un = unread || 0

  function B({ to, ic, label, cnt, on, plus }) {
    return (
      <button className={(on ? 'on ' : '') + (plus ? 'plus' : '')} onClick={() => nav(to)}>
        <Icon name={ic} />{!plus && <span>{label}</span>}
        {cnt > 0 && <i className="bd">{cnt > 9 ? '9+' : cnt}</i>}
      </button>
    )
  }

  return (
    <nav>
      <B to="/" ic="home" label="Home" on={HOME_PAGES.includes(pathname)} />
      {onMarket ? <B to="/chats" ic="chat" label="Chats" cnt={un} /> : <B to="/market" ic="market" label="Market" />}
      {onMarket ? <B to="/post" ic="plus" label="Post" plus /> : <B to="/chats" ic="chat" label="Chats" cnt={un} on={pathname.startsWith('/chats')} />}
      <B to="/dash" ic="dash" label="Dashboard" on={pathname.startsWith('/dash')} />
      <B to="/events" ic="events" label="Events" on={pathname === '/events'} />
    </nav>
  )
}
