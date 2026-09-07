'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Globe, X } from 'lucide-react'
import { LANGUAGES, scriptClass, t } from '@/lib/languages'

export default function LanguageModal({ open, current, onSelect, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-t-3xl border border-teal-500/20 bg-slate-900/95 p-5 shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label="Select language"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-400 text-white shadow-lg shadow-teal-500/25">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className={`text-xl font-bold text-white ${scriptClass(LANGUAGES.find((l) => l.code === current))}`} dir="rtl">
                  {t(current, 'selectLanguage')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-teal-200/60 transition hover:bg-white/10 hover:text-teal-100"
                aria-label="Close language selector"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 max-h-[65vh] space-y-2 overflow-y-auto pb-1">
              {LANGUAGES.map((lang) => {
                const selected = lang.code === current
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onSelect(lang.code)
                      onClose()
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? 'border-teal-400 bg-teal-500/15'
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${scriptClass(lang)}`}
                      style={{ backgroundColor: lang.color }}
                      dir="rtl"
                    >
                      {lang.native}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-2xl leading-snug text-white ${scriptClass(lang)}`} dir="rtl">
                        {lang.native}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-teal-200/60">
                        {lang.name} · {lang.region}
                      </span>
                    </span>
                    {selected && <Check className="h-6 w-6 shrink-0 text-teal-400" strokeWidth={3} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
