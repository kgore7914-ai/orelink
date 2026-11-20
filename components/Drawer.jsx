'use client'
import { useNavigate } from '../lib/nav.js'
import { useAuth } from '../context/AuthContext.jsx'
import Badge from './Badge.jsx'

// Side menu, same items as the prototype.
export default function Drawer({ open, onClose, onTour }) {
  const nav = useNavigate()
  const { profile, status, isAdmin } = useAuth()
  if (!open) return null
  const p = profile || {}
  const go = (to) => { onClose(); nav(to) }
  const It = ({ ic, t, to }) => (
    <button className="dr-it" onClick={() => go(to)}><span className="dr-ic">{ic}</span>{t}</button>
  )
  return (
    <>
      <div className="dr-ov" onClick={onClose} />
      <div className="dr">
        <button className="dr-prof" onClick={() => go('/me')}>
          <span className="av">{(p.name || '?').charAt(0).toUpperCase()}</span>
          <span><b>{p.name || 'Member'}</b><div className="sub"><Badge status={status} /> {'·'} View profile</div></span>
        </button>
        <div className="sub" style={{ margin: '16px 4px 2px' }}>Menu</div>
        <It ic={'📊'} t="Dashboard" to="/dash" />
        <It ic={'🛒'} t="Marketplace" to="/market" />
        <It ic={'📰'} t="News" to="/news" />
        <It ic={'📈'} t="Feed" to="/feed" />
        <It ic={'🧰'} t="Services" to="/services" />
        <It ic={'📍'} t="Events" to="/events" />
        <It ic={'💳'} t="Subscription" to="/sub" />
        <div className="sub" style={{ margin: '16px 4px 2px' }}>More</div>
        <It ic={'❓'} t="Help and support" to="/help" />
        <It ic={'⚙️'} t="Settings and privacy" to="/me" />
        <button className="dr-it" onClick={() => { onClose(); onTour() }}><span className="dr-ic">{'🎓'}</span>App tour</button>
        <It ic={'ℹ️'} t="About us" to="/about" />
        <It ic={'📄'} t="Terms of use" to="/terms" />
        {isAdmin && <It ic={'🛡️'} t="Admin review" to="/admin" />}
      </div>
    </>
  )
}
