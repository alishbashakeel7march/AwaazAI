'use client'

import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

export default function MicButton({ phase = 'idle', onPress }) {
  const recording = phase === 'recording'
  const busy = phase === 'transcribing' || phase === 'thinking'

  return (
    <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
      {recording && (
        <>
          <motion.span
            className="absolute h-40 w-40 rounded-full border-4 border-rose-400/70 sm:h-48 sm:w-48"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute h-40 w-40 rounded-full border-4 border-rose-400/50 sm:h-48 sm:w-48"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
          />
        </>
      )}
      {!recording && !busy && (
        <motion.span
          className="absolute h-40 w-40 rounded-full bg-teal-400/25 sm:h-48 sm:w-48"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.18], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <motion.button
        type="button"
        onClick={onPress}
        disabled={busy}
        whileTap={{ scale: 0.92 }}
        whileHover={busy ? undefined : { scale: 1.04 }}
        className={`relative z-10 flex h-40 w-40 items-center justify-center rounded-full text-white shadow-2xl transition-colors sm:h-48 sm:w-48 ${
          recording
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/40'
            : 'bg-gradient-to-br from-teal-400 to-emerald-400 shadow-teal-500/40'
        } ${busy ? 'cursor-wait opacity-85' : 'cursor-pointer'}`}
        aria-label={recording ? 'Stop recording' : 'Start speaking'}
      >
        {busy ? (
          <span className="h-14 w-14 animate-spin rounded-full border-[5px] border-white/30 border-t-white sm:h-16 sm:w-16" />
        ) : recording ? (
          <Square className="h-14 w-14 sm:h-16 sm:w-16" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Mic className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.8} aria-hidden="true" />
        )}
      </motion.button>
    </div>
  )
}
