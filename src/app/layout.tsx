import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'IMJUSTAGIRL. Social Club',
    template: '%s | IMJUSTAGIRL.',
  },
  description:
    'An exclusive social club for women who move with intention. Community, events, and connection.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'IMJUSTAGIRL. Social Club',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ivory text-forest antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
