'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabaseReady } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import Shell from './Shell.jsx'

const OPEN = ['/welcome', '/signin', '/join']

function Loading() {
  return <main><div className="note">Loading...</div></main>
}

function SetupNeeded() {
  return (
    <main>
      <div className="card">
        <div className="big">Almost there</div>
        <div className="sub">OreLink is not connected to its database yet. Check that <b>.env.local</b> has
          NEXT_PUBLIC_SUPABASE_URL and your Supabase key, then stop and restart <b>pnpm dev</b>.</div>
      </div>
    </main>
  )
}

// Decides what each visitor may see:
// signed out -> welcome / sign in / sign up only
// signed in without a profile -> finish sign-up
// signed in with a profile -> the app (header, bottom bar, menu)
export default function Gate({ children }) {
  const { ready, busy, session, profile } = useAuth()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const onOpen = OPEN.includes(pathname)

  let target = null
  if (supabaseReady && ready) {
    if (!session && !onOpen) target = '/welcome'
    else if (session && !busy && !profile && pathname !== '/join') target = '/join'
    else if (session && !busy && profile && onOpen) target = '/'
  }

  useEffect(() => { if (target) router.replace(target) }, [target, router])

  if (!supabaseReady) return <SetupNeeded />
  if (!ready || target) return <Loading />
  if (!session || busy || !profile) {
    if (busy && !onOpen) return <Loading />
    return children
  }
  return <Shell>{children}</Shell>
}
