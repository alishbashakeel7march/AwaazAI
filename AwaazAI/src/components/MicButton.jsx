'use client'

import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'

export default function MicButton({ phase = 'idle', onPress }) {
  const recording = phase === 'recording'
  const busy = phase === 'transcribing' || phase === 'thinking'

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {recording && (
        <>
          <motion.span
            className="absolute h-40 w-40 rounded-full border-4 border-rose-400/70"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute h-40 w-40 rounded-full border-4 border-rose-400/50"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
          />
        </>
      )}
      {!recording && !busy && (
        <motion.span
          className="absolute h-40 w-40 rounded-full bg-brand-500/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 1.14], opacity: [0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <motion.button
        type="button"
        onClick={onPress}
        disabled={busy}
        whileTap={{ scale: 0.92 }}
        whileHover={busy ? undefined : { scale: 1.04 }}
        className={`relative z-10 flex h-40 w-40 items-center justify-center rounded-full text-white transition-colors ${
          recording
            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-2xl shadow-rose-500/40'
            : 'bg-gradient-to-br from-brand-600 to-teal-500 shadow-2xl shadow-brand-600/40'
        } ${busy ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
        aria-label={recording ? 'Stop recording' : 'Start speaking'}
      >
        {busy ? (
          <span className="h-14 w-14 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
        ) : recording ? (
          <Square className="h-14 w-14" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Mic className="h-16 w-16" strokeWidth={1.8} aria-hidden="true" />
        )}
      </motion.button>
    </div>
  )
}
