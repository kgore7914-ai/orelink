'use client'
import { useEffect } from 'react'
import { supabaseReady } from '../lib/supabaseClient.js'
import { AuthProvider } from '../context/AuthContext.jsx'
import { applyTheme, lsTheme } from '../lib/theme.js'
import Gate from './Gate.jsx'

export default function Providers({ children }) {
  useEffect(() => { applyTheme(lsTheme() || 'dark') }, [])
  if (!supabaseReady) return <Gate>{children}</Gate>
  return <AuthProvider><Gate>{children}</Gate></AuthProvider>
}
