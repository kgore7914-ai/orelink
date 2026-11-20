import { Suspense } from 'react'
import Join from '../../components/screens/Join.jsx'

export default function Page() {
  return <Suspense fallback={null}><Join /></Suspense>
}
