'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Info, MessageCircle, Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { scriptClass, t } from '@/lib/languages'

const RELATED_LANGS = {
  ur: ['ur', 'hi', 'ar', 'fa'],
  sd: ['sd', 'ur', 'hi', 'ar'],
  ps: ['ps', 'fa', 'ar', 'ur'],
  pa: ['ur', 'pa', 'hi'],
  bal: ['ur', 'fa', 'ar'],
}

function chunkText(text, max = 180) {
  if (!text || text.length <= max) return [text || '']
  const chunks = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= max) {
      chunks.push(remaining)
      break
    }
    let cut = -1
    for (const sep of ['۔', '!', '?', '.', '\n']) {
      const idx = remaining.lastIndexOf(sep, max)
      if (idx > 20) {
        cut = idx + 1
        break
      }
    }
    if (cut <= 0) {
      for (const sep of ['،', ',', ' ']) {
        const idx = remaining.lastIndexOf(sep, max)
        if (idx > 20) {
          cut = idx + 1
          break
        }
      }
    }
    if (cut <= 0) cut = max
    chunks.push(remaining.slice(0, cut).trim())
    remaining = remaining.slice(cut).trim()
  }
  return chunks.filter(Boolean)
}

function pickVoice(voices, lang) {
  if (!voices?.length) return null
  const exact = voices.find((v) => v.lang?.toLowerCase() === lang.speechCode?.toLowerCase())
  if (exact) return exact
  const related = RELATED_LANGS[lang.code] || [lang.code]
  for (const code of related) {
    const match =
      voices.find((v) => v.lang?.toLowerCase().startsWith(`${code}-`)) ||
      voices.find((v) => v.lang?.toLowerCase() === code)
    if (match) return match
  }
  return voices[0] || null
}

export default function ResponseCard({
  answer,
  complete,
  takeaways,
  language,
  languageCode,
  category,
  demo,
  onAskAnother,
  onPlaybackEnd,
  onPlayingChange,
}) {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  const startedAtRef = useRef(0)
  const pausedAccRef = useRef(0)
  const pausedAtRef = useRef(0)
  const cancelledRef = useRef(false)
  const cardRef = useRef(null)
  const audioRef = useRef(null)

  const stop = useCallback(() => {
    cancelledRef.current = true
    try {
      window.speechSynthesis?.cancel()
    } catch {}
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {}
      audioRef.current = null
    }
    setPlaying(false)
    setPaused(false)
    onPlayingChange?.(false)
  }, [onPlayingChange])

  const speak = useCallback(async () => {
    const text = [answer, ...takeaways].join(' \n ').trim()
    if (!text) return

    cancelledRef.current = false
    startedAtRef.current = Date.now()
    pausedAccRef.current = 0

    setPlaying(true)
    setPaused(false)
    onPlayingChange?.(true)

    const gttsLang = language.gttsCode || language.whisperCode || 'ur'
    const chunks = chunkText(text)

    let googleFailed = false
    try {
      for (let i = 0; i < chunks.length; i++) {
        if (cancelledRef.current) break
        const url = `/api/tts?tl=${encodeURIComponent(gttsLang)}&q=${encodeURIComponent(chunks[i])}`
        const res = await fetch(url)
        if (!res.ok) {
          googleFailed = true
          break
        }
        const blob = await res.blob()
        if (cancelledRef.current) break
        if (blob.size < 100) continue
        const objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)
        audioRef.current = audio
        audio.playbackRate = 1.0

        await new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(objectUrl)
            if (audioRef.current === audio) audioRef.current = null
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            if (audioRef.current === audio) audioRef.current = null
            googleFailed = true
            resolve()
          }
          audio.play().catch(() => {
            URL.revokeObjectURL(objectUrl)
            if (audioRef.current === audio) audioRef.current = null
            googleFailed = true
            resolve()
          })
        })
        if (googleFailed) break
      }
    } catch (err) {
      console.warn('[MultiModel TTS] Google TTS failed:', err?.message)
      googleFailed = true
    }

    if (!googleFailed && !cancelledRef.current) {
      const seconds = (Date.now() - startedAtRef.current - pausedAccRef.current) / 1000
      setPlaying(false)
      setPaused(false)
      onPlayingChange?.(false)
      if (seconds > 0) onPlaybackEnd?.(Math.min(seconds, 600))
      return
    }

    if (cancelledRef.current) {
      setPlaying(false)
      setPaused(false)
      onPlayingChange?.(false)
      return
    }

    if (!('speechSynthesis' in window)) {
      setUnsupported(true)
      setPlaying(false)
      onPlayingChange?.(false)
      return
    }

    const synth = window.speechSynthesis
    try {
      synth.cancel()
    } catch {}

    const voices = synth.getVoices()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(voices, language)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || language.speechCode || 'ur-PK'
    } else {
      utterance.lang = language.speechCode || 'ur-PK'
    }
    utterance.rate = 0.95
    utterance.volume = 1

    utterance.onend = () => {
      setPlaying(false)
      setPaused(false)
      onPlayingChange?.(false)
      if (!cancelledRef.current) {
        const seconds = (Date.now() - startedAtRef.current - pausedAccRef.current) / 1000
        if (seconds > 0) onPlaybackEnd?.(Math.min(seconds, 600))
      }
    }
    utterance.onerror = () => {
      setPlaying(false)
      setPaused(false)
      onPlayingChange?.(false)
    }

    setTimeout(() => {
      if (!cancelledRef.current) {
        try {
          synth.speak(utterance)
        } catch {
          setPlaying(false)
          onPlayingChange?.(false)
        }
      }
    }, 250)
  }, [answer, takeaways, language, onPlaybackEnd, onPlayingChange])

  useEffect(() => {
    if (complete && (answer?.trim() || takeaways.length > 0)) {
      speak()
    }
    return () => {
      cancelledRef.current = true
      try {
        window.speechSynthesis?.cancel()
      } catch {}
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {}
        audioRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, answer])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      try {
        window.speechSynthesis?.cancel()
      } catch {}
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {}
        audioRef.current = null
      }
      onPlayingChange?.(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const togglePause = () => {
    const audio = audioRef.current
    if (audio) {
      if (paused) {
        audio.play().catch(() => {})
        pausedAccRef.current += Date.now() - pausedAtRef.current
        setPaused(false)
      } else if (playing) {
        audio.pause()
        pausedAtRef.current = Date.now()
        setPaused(true)
      }
      return
    }
    const synth = window.speechSynthesis
    if (!synth) return
    if (paused) {
      synth.resume()
      pausedAccRef.current += Date.now() - pausedAtRef.current
      setPaused(false)
    } else if (playing) {
      synth.pause()
      pausedAtRef.current = Date.now()
      setPaused(true)
    }
  }

  const nativeLabel = (key) => (
    <span className={scriptClass(language)} dir="rtl">
      {t(languageCode, key)}
    </span>
  )

  return (
    <motion.section
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="overflow-hidden rounded-3xl border border-teal-500/20 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-md"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-teal-500/10 bg-white/5 px-4 py-3 sm:px-5 sm:py-3.5">
        {category && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
            style={{ backgroundColor: `${category.color}18`, color: category.color }}
          >
            {category.name}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold shadow-sm ${scriptClass(language)}`}
          dir="rtl"
          style={{ color: language.color }}
        >
          {language.native}
        </span>
        {demo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
            Demo Mode
          </span>
        )}
        {playing && (
          <motion.span
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-teal-300"
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {paused ? 'Paused' : 'Speaking'}
          </motion.span>
        )}
      </div>

      <div className="px-5 py-6 sm:px-6 sm:py-7">
        <p
          className={`whitespace-pre-line text-2xl leading-[2] text-white/95 md:text-3xl ${scriptClass(language)}`}
          dir="rtl"
        >
          {answer}
          {!complete && (
            <span className="ms-1 inline-block h-6 w-2 animate-pulse rounded-sm bg-teal-400 align-middle" aria-hidden="true" />
          )}
        </p>

        {complete && takeaways.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white/5 p-4 sm:p-5">
            <p className={`text-lg font-bold text-teal-100 ${scriptClass(language)}`} dir="rtl">
              {t(languageCode, 'keyPoints')}
            </p>
            <ul className="mt-3 space-y-2.5">
              {takeaways.map((point, index) => (
                <motion.li
                  key={`${index}-${point.slice(0, 12)}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-teal-500/10 bg-white/5 px-4 py-3 shadow-sm"
                >
                  <Check className="mt-1.5 h-5 w-5 shrink-0 text-teal-400" strokeWidth={3} aria-hidden="true" />
                  <span className={`text-lg leading-relaxed text-teal-50/90 ${scriptClass(language)}`} dir="rtl">
                    {point}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {unsupported && (
          <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-teal-200/60">
            Voice playback is not supported in this browser — the written answer above is always available.
          </p>
        )}

        {complete && (
          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={speak}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-teal-500/20 bg-white/5 px-2 py-3 text-xs font-bold text-white shadow-lg shadow-black/20 transition hover:bg-white/10 sm:text-sm"
            >
              <RotateCcw className="h-6 w-6 shrink-0" aria-hidden="true" />
              {nativeLabel('playAgain')}
            </button>
            <button
              type="button"
              onClick={togglePause}
              disabled={!playing && !paused}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 px-2 py-3 text-xs font-bold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 sm:text-sm"
            >
              {paused ? <Play className="h-6 w-6 shrink-0" aria-hidden="true" /> : <Pause className="h-6 w-6 shrink-0" aria-hidden="true" />}
              {nativeLabel(paused ? 'resume' : 'pause')}
            </button>
            <button
              type="button"
              onClick={() => {
                stop()
                onAskAnother()
              }}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-teal-500/30 bg-teal-500/10 px-2 py-3 text-xs font-bold text-teal-100 transition hover:border-teal-400 hover:bg-teal-500/20 sm:text-sm"
            >
              <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
              {nativeLabel('askAnother')}
            </button>
          </div>
        )}

        <p className={`mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-teal-300/50 ${scriptClass(language)}`} dir="rtl">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t(languageCode, 'disclaimer')}
        </p>
      </div>
    </motion.section>
  )
}
