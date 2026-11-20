'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { applyTheme, lsTheme } from '../lib/theme.js'

const AuthCtx = createContext(null)

const EMPTY = {
  profile: null, contacts: null, isAdmin: false, verified: null,
  suspended: false, kyc: null, docs: [], forUid: null,
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [data, setData] = useState(EMPTY)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async (s) => {
    const uid = s && s.user && s.user.id
    if (!uid) { setData(EMPTY); setLoaded(true); applyTheme(lsTheme() || 'dark'); return }
    const one = (t, col) => supabase.from(t).select('*').eq(col || 'user_id', uid).maybeSingle()
    const [p, a, v, su, k, d, c] = await Promise.all([
      one('profiles', 'id'), one('admins'), one('verifications'), one('suspensions'),
      one('kyc'), supabase.from('kyc_docs').select('*').eq('user_id', uid), one('contacts'),
    ])
    const next = {
      profile: p.data || null,
      isAdmin: !!a.data,
      verified: v.data || null,
      suspended: !!su.data,
      kyc: k.data || null,
      docs: d.data || [],
      contacts: c.data || null,
      forUid: uid,
    }
    setData(next)
    applyTheme((next.profile && next.profile.theme) || lsTheme() || 'dark')
    setLoaded(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => { setSession(d.session); load(d.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      // Run outside the auth callback, as Supabase recommends.
      setTimeout(() => load(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  const refresh = useCallback(() => load(session), [load, session])
  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])

  const user = session ? session.user : null
  const isV = (!!data.verified || data.isAdmin) && !data.suspended
  const status = data.verified ? 'verified' : data.kyc && data.kyc.submitted ? 'pending' : 'unverified'

  return (
    <AuthCtx.Provider value={{ session, user, ready: loaded && session !== undefined, busy: !!session && data.forUid !== session.user.id, ...data, isV, status, refresh, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx) || {}
}
