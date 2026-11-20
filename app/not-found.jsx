'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Unknown address -> back to home (same as the prototype).
export default function NotFound() {
  const r = useRouter()
  useEffect(() => { r.replace('/') }, [r])
  return null
}
