'use client'

import { motion } from 'framer-motion'
import { CATEGORIES, scriptClass } from '@/lib/languages'

export default function CategoryGrid({ active, onSelect, languageCode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
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
            className="flex flex-col items-center gap-2.5 rounded-3xl border-2 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            style={
              isActive
                ? { borderColor: category.color, backgroundColor: category.soft }
                : { borderColor: '#e7e5e4' }
            }
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: category.soft, color: category.color }}
            >
              <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span
              className={`text-center text-lg leading-snug ${scriptClass(active ? active : null)}`}
              dir="rtl"
              style={{ color: isActive ? category.color : '#44403c' }}
            >
              {category.native[languageCode] || category.native.ur}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {category.name}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
