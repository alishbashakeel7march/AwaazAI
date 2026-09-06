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

/**
 * Split text into chunks of at most `max` chars, preferring sentence/word
 * boundaries so Google TTS produces natural-sounding segments.
 */
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
    // Try sentence-ending punctuation first
    for (const sep of ['۔', '!', '?', '.', '\n']) {
      const idx = remaining.lastIndexOf(sep, max)
      if (idx > 20) {
        cut = idx + 1
        break
      }
    }
    // Fall back to comma / space
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
    } catch {
      // some browsers throw on cancel() with no active utterance
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {
        // ignore
      }
      audioRef.current = null
    }
    setPlaying(false)
    setPaused(false)
    onPlayingChange?.(false)
  }, [onPlayingChange])

  /**
   * Speak the response aloud.
   * Primary: Google Translate TTS via /api/tts proxy (works for ur/sd/ps/pa).
   * Fallback: browser Web Speech API (used if the proxy fails or is blocked).
   */
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

    // --- Primary: Google Translate TTS ---
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
        if (blob.size < 100) {
          // Empty/tiny response — skip this chunk
          continue
        }
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
      console.warn('[AwaazAI TTS] Google TTS failed:', err?.message)
      googleFailed = true
    }

    // If Google TTS succeeded and wasn't cancelled, we're done
    if (!googleFailed && !cancelledRef.current) {
      const seconds = (Date.now() - startedAtRef.current - pausedAccRef.current) / 1000
      setPlaying(false)
      setPaused(false)
      onPlayingChange?.(false)
      if (seconds > 0) onPlaybackEnd?.(Math.min(seconds, 600))
      return
    }

    // --- Fallback: Web Speech API ---
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
    } catch {
      // ignore
    }

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

    // Chrome bug: cancel() right before speak() can silently drop the utterance.
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
      } catch {
        // ignore
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {
          // ignore
        }
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
      } catch {
        // ignore
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch {
          // ignore
        }
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
      className="overflow-hidden rounded-3xl border-2 border-brand-100 bg-white shadow-xl shadow-brand-900/5"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 bg-brand-50/60 px-5 py-3.5">
        {category && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
            style={{ backgroundColor: category.soft, color: category.color }}
          >
            {category.name}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold ${scriptClass(language)}`}
          dir="rtl"
          style={{ color: language.color }}
        >
          {language.native}
        </span>
        {demo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            Demo Mode
          </span>
        )}
        {playing && (
          <motion.span
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
            animate={{ opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {paused ? 'Paused' : 'Speaking'}
          </motion.span>
        )}
      </div>

      <div className="px-5 py-5">
        <p
          className={`whitespace-pre-line text-xl leading-[2] text-stone-800 md:text-2xl ${scriptClass(language)}`}
          dir="rtl"
        >
          {answer}
          {!complete && (
            <span className="ms-1 inline-block h-5 w-2 animate-pulse rounded-sm bg-brand-500 align-middle" aria-hidden="true" />
          )}
        </p>

        {complete && takeaways.length > 0 && (
          <div className="mt-5 rounded-2xl bg-brand-50/70 p-4">
            <p className={`text-base font-bold text-brand-800 ${scriptClass(language)}`} dir="rtl">
              {t(languageCode, 'keyPoints')}
            </p>
            <ul className="mt-2.5 space-y-2">
              {takeaways.map((point, index) => (
                <motion.li
                  key={`${index}-${point.slice(0, 12)}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                  className="flex items-start gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-sm"
                >
                  <Check className="mt-1.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={3} aria-hidden="true" />
                  <span className={`text-lg leading-relaxed text-stone-700 ${scriptClass(language)}`} dir="rtl">
                    {point}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {unsupported && (
          <p className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-500">
            Voice playback is not supported in this browser — the written answer above is always available.
          </p>
        )}

        {complete && (
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={speak}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-2 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
              {nativeLabel('playAgain')}
            </button>
            <button
              type="button"
              onClick={togglePause}
              disabled={!playing && !paused}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-stone-800 px-2 py-3.5 text-sm font-bold text-white transition hover:bg-stone-900 disabled:opacity-40"
            >
              {paused ? <Play className="h-5 w-5 shrink-0" aria-hidden="true" /> : <Pause className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {nativeLabel(paused ? 'resume' : 'pause')}
            </button>
            <button
              type="button"
              onClick={() => {
                stop()
                onAskAnother()
              }}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-brand-50 px-2 py-3.5 text-sm font-bold text-brand-800 transition hover:border-brand-400"
            >
              <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {nativeLabel('askAnother')}
            </button>
          </div>
        )}

        <p className={`mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-stone-400 ${scriptClass(language)}`} dir="rtl">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t(languageCode, 'disclaimer')}
        </p>
      </div>
    </motion.section>
  )
}
