'use client'

import { motion } from 'framer-motion'
import { CATEGORIES, getLanguage, scriptClass } from '@/lib/languages'

export default function CategoryGrid({ active, onSelect, languageCode }) {
  const language = getLanguage(languageCode)

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {CATEGORIES.map((category, index) => {
        const Icon = category.icon
        const isActive = active?.id === category.id
        return (
          <motion.button
            key={category.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            onClick={() => onSelect(isActive ? null : category)}
            aria-pressed={isActive}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            className={`group flex flex-col items-center justify-center rounded-2xl border p-3 shadow-sm transition-all hover:shadow-lg sm:p-5 ${
              isActive
                ? 'border-transparent ring-2 ring-offset-2 ring-offset-cream'
                : 'border-teal-500/15 bg-white/5 hover:border-teal-400/40 hover:bg-white/10'
            }`}
            style={
              isActive
                ? { backgroundColor: `${category.color}20`, '--tw-ring-color': category.color }
                : undefined
            }
          >
            <span
              className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 sm:mb-3 sm:h-14 sm:w-14"
              style={{ backgroundColor: isActive ? `${category.color}30` : 'rgb(255 255 255 / 0.10)', color: category.color }}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span
              className={`text-center text-sm font-bold leading-snug text-white sm:text-base ${scriptClass(language)}`}
              dir="rtl"
            >
              {category.native[languageCode] || category.native.ur}
            </span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-wider text-teal-200/50 sm:block sm:text-[10px]">
              {category.name}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
