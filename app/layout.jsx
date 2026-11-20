import '../styles/orelink.css'
import '../styles/desktop.css'
import Providers from '../components/Providers.jsx'

export const metadata = {
  title: 'OreLink - Mineral Marketplace',
  description: 'Buy and sell minerals, equipment and mining services in Zimbabwe.',
  icons: { icon: '/img/pgold.jpg' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#090d12',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
