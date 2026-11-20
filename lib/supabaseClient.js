import { createClient } from '@supabase/supabase-js'

// Next.js only exposes settings that start with NEXT_PUBLIC_.
// Works with either key name Supabase gives you.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseReady = Boolean(url && key)
export const supabase = supabaseReady ? createClient(url, key) : null
