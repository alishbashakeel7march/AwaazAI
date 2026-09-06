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
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label="Select language"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className={`text-xl font-bold text-stone-800 ${scriptClass(LANGUAGES.find((l) => l.code === current))}`} dir="rtl">
                  {t(current, 'selectLanguage')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
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
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-transparent bg-stone-100 hover:bg-stone-200/70'
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
                      <span className={`block text-2xl leading-snug text-stone-800 ${scriptClass(lang)}`} dir="rtl">
                        {lang.native}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                        {lang.name} · {lang.region}
                      </span>
                    </span>
                    {selected && <Check className="h-6 w-6 shrink-0 text-brand-700" strokeWidth={3} aria-hidden="true" />}
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
