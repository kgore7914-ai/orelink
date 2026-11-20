'use client'
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation'

// Small helpers so screens can move between pages.
export function useNavigate() {
  const r = useRouter()
  return (to, opts) => (opts && opts.replace ? r.replace(to) : r.push(to))
}

export function useLocation() {
  return { pathname: usePathname() || '/' }
}

export function useSearchParams() {
  return [useNextSearchParams()]
}
