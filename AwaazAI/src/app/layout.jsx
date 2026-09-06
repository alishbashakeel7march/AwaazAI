import './globals.css'
import Link from 'next/link'
import { Mic, ShieldCheck } from 'lucide-react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: {
    default: 'AwaazAI — Free Voice AI for Pakistan',
    template: '%s · AwaazAI',
  },
  description:
    'A 100% free, voice-first AI assistant for Urdu, Sindhi, Pashto, Punjabi and Balochi speakers. Ask by voice, listen to simple answers.',
  applicationName: 'AwaazAI',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'AwaazAI', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon-1024.png', sizes: '1024x1024' }],
  },
}

export const viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-cream font-sans text-ink antialiased">
        <ServiceWorkerRegister />
        <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-3" aria-label="AwaazAI home">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-600/25">
                <Mic className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold tracking-tight">AwaazAI</span>
                <span className="block font-arabic text-[13px] font-medium text-stone-500">آواز · Voice for everyone</span>
              </span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200/70 py-5 text-center text-xs text-stone-400">
          AwaazAI — 100% free voice assistance · اردو · سنڌي · پښتو · پنجابی · بلوچی
        </footer>
      </body>
    </html>
  )
}
