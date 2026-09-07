import './globals.css'
import Link from 'next/link'
import { Mic, Settings } from 'lucide-react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: {
    default: 'MultiModel — Free Voice AI for Pakistan',
    template: '%s · MultiModel',
  },
  description:
    'A 100% free, voice-first AI assistant for Urdu, Sindhi, Pashto, Punjabi and Balochi speakers. Ask by voice, listen to simple answers.',
  applicationName: 'MultiModel',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'MultiModel', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-1024.png', sizes: '1024x1024' }],
  },
}

export const viewport = {
  themeColor: '#0D9488',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-cream font-sans text-ink antialiased">
        <ServiceWorkerRegister />
        <header className="sticky top-0 z-50 border-b border-teal-500/10 bg-cream/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3" aria-label="MultiModel home">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-400 text-white shadow-lg shadow-teal-500/25">
                <Mic className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold tracking-tight text-white">MultiModel</span>
                <span className="hidden font-arabic text-[13px] font-medium text-teal-200/70 sm:block">Voice for everyone · آواز</span>
              </span>
            </Link>
            <Link
              href="/admin"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-teal-100 transition hover:bg-white/10 hover:text-teal-300 sm:w-auto sm:gap-2 sm:px-4"
              aria-label="Admin dashboard"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              <span className="hidden text-sm font-bold sm:inline">Admin</span>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-teal-500/10 py-4 text-center text-xs font-medium text-teal-300/50">
          <span className="inline-flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            MultiModel
          </span>
        </footer>
      </body>
    </html>
  )
}
