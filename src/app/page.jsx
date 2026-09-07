'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ChevronDown, Globe, Lightbulb, RotateCcw, Send, Sparkles, Zap } from 'lucide-react'
import AudioVisualizer from '@/components/AudioVisualizer'
import CategoryGrid from '@/components/CategoryGrid'
import LanguageModal from '@/components/LanguageModal'
import MicButton from '@/components/MicButton'
import ResponseCard from '@/components/ResponseCard'
import {
  DEFAULT_LANGUAGE,
  exampleFor,
  getCategory,
  getLanguage,
  scriptClass,
  t,
} from '@/lib/languages'

const SESSION_KEY = 'awaaz_session'
const LANG_KEY = 'awaaz_language'
const MAX_RECORDING_MS = 30000

function parseAnswer(raw) {
  const lines = (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const takeaways = []
  const body = []
  for (const line of lines) {
    const bullet = line.match(/^[•·\-–*]\s+(.*)$/)
    if (bullet) {
      if (takeaways.length < 4) takeaways.push(bullet[1])
    } else {
      body.push(line)
    }
  }
  return { body: body.join('\n'), takeaways }
}

function formatElapsed(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function friendlyErrorDetail(detail) {
  if (!detail) return ''
  const raw = String(detail).toLowerCase()
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('unavailable')) {
    return 'Internet connection mein masla hai — barah-e-karam dobara try karein.'
  }
  return detail
}

export default function Home() {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE)
  const [showLanguages, setShowLanguages] = useState(false)
  const [category, setCategory] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer] = useState('')
  const [takeaways, setTakeaways] = useState([])
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [typed, setTyped] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [analyser, setAnalyser] = useState(null)

  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioCtxRef = useRef(null)
  const recognitionRef = useRef(null)
  const stopTimerRef = useRef(null)
  const tickTimerRef = useRef(null)
  const startedAtRef = useRef(0)
  const interimRef = useRef('')
  const analyticsIdRef = useRef(null)
  const sessionIdRef = useRef(null)
  const phaseRef = useRef('idle')

  const language = getLanguage(languageCode)
  const busy = phase === 'recording' || phase === 'transcribing' || phase === 'thinking'

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved) setLanguageCode(saved)
    let session = localStorage.getItem(SESSION_KEY)
    if (!session) {
      session = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, session)
    }
    sessionIdRef.current = session
    const fromShortcut = getCategory(new URLSearchParams(window.location.search).get('category') || '')
    if (fromShortcut) setCategory(fromShortcut)

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const changeLanguage = (code) => {
    setLanguageCode(code)
    localStorage.setItem(LANG_KEY, code)
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  const cleanupAudio = useCallback(() => {
    clearTimeout(stopTimerRef.current)
    clearInterval(tickTimerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    setAnalyser(null)
    recorderRef.current = null
    recognitionRef.current = null
  }, [])

  useEffect(() => cleanupAudio, [cleanupAudio])

  const askQuestion = useCallback(
    async (text) => {
      const question = String(text || '').trim()
      if (!question) return
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setTranscript(question)
      setAnswer('')
      setTakeaways([])
      setError(null)
      setDemo(false)
      analyticsIdRef.current = null
      setPhase('thinking')

      const startedAt = Date.now()
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            question,
            language: languageCode,
            category: category?.id || null,
          }),
        })
        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || 'The assistant is unavailable right now.')
        }
        setDemo(res.headers.get('x-demo-mode') === '1')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setAnswer(accumulated)
        }

        const parsed = parseAnswer(accumulated)
        setAnswer(parsed.body)
        setTakeaways(parsed.takeaways)
        setPhase('answered')

        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            language: languageCode,
            category: category?.id || null,
            question,
            answer: accumulated,
            responseDurationMs: Date.now() - startedAt,
          }),
        })
          .then((r) => r.json())
          .then((payload) => {
            if (payload?.id) analyticsIdRef.current = payload.id
          })
          .catch(() => {})
      } catch (err) {
        setError({
          message: t(languageCode, 'error'),
          detail: err?.message || 'Please try again.',
        })
        setPhase('error')
      }
    },
    [category, languageCode],
  )

  const startWebSpeech = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError({
        message: t(languageCode, 'error'),
        detail: 'Voice input is not supported in this browser — please type your question below.',
      })
      setPhase('error')
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition
    recognition.lang = language.speechCode
    recognition.interimResults = true
    recognition.continuous = false

    let handled = false
    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      setTranscript(interim || final)
      if (final && !handled) {
        handled = true
        recognition.stop()
        askQuestion(final)
      }
      if (interim) interimRef.current = interim
    }
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (!handled && phaseRef.current === 'recording') setPhase('idle')
        return
      }
      setError({
        message: t(languageCode, 'error'),
        detail: `Speech recognition error: ${event.error}. You can type your question below.`,
      })
      setPhase('error')
    }
    recognition.onend = () => {
      if (!handled && phaseRef.current === 'recording') setPhase('idle')
    }

    setPhase('recording')
    interimRef.current = ''
    startedAtRef.current = Date.now()
    setElapsed(0)
    clearInterval(tickTimerRef.current)
    tickTimerRef.current = setInterval(() => {
      setElapsed(Math.min(Math.floor((Date.now() - startedAtRef.current) / 1000), Math.floor(MAX_RECORDING_MS / 1000)))
    }, 250)
    clearTimeout(stopTimerRef.current)
    stopTimerRef.current = setTimeout(() => {
      if (handled || phaseRef.current !== 'recording') return
      handled = true
      try { recognition.stop() } catch { /* already stopped */ }
      const partial = interimRef.current.trim()
      cleanupAudio()
      if (partial) {
        askQuestion(partial)
      } else {
        setPhase('idle')
      }
    }, MAX_RECORDING_MS)
    recognition.start()
  }, [askQuestion, language.speechCode, languageCode])

  const transcribe = useCallback(
    async (blob) => {
      setPhase('transcribing')
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')
      form.append('language', languageCode)
      try {
        const res = await fetch('/api/stt', { method: 'POST', body: form })
        if (res.status === 503) {
          startWebSpeech()
          return
        }
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (payload.fallback === 'web-speech') {
            startWebSpeech()
            return
          }
          throw new Error(payload.error || 'Transcription failed.')
        }
        askQuestion(payload.transcript)
      } catch (err) {
        if (err?.message === 'Failed to fetch') {
          startWebSpeech()
          return
        }
        setError({ message: t(languageCode, 'error'), detail: err?.message || 'Please try again.' })
        setPhase('error')
      }
    },
    [askQuestion, languageCode, startWebSpeech],
  )

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    const recognition = recognitionRef.current
    if (recognition) {
      recognition.stop()
      return
    }
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAnswer('')
    setTakeaways([])
    setTranscript('')
    setDemo(false)
    analyticsIdRef.current = null
    setPhase('recording')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        cleanupAudio()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 1000) {
          transcribe(blob)
        } else {
          setPhase('idle')
        }
      }

      recorder.start(250)
      startedAtRef.current = Date.now()
      setElapsed(0)
      clearInterval(tickTimerRef.current)
      tickTimerRef.current = setInterval(() => {
        setElapsed(Math.min(Math.floor((Date.now() - startedAtRef.current) / 1000), Math.floor(MAX_RECORDING_MS / 1000)))
      }, 250)
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS)
    } catch (err) {
      cleanupAudio()
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
      setError(
        denied
          ? {
              message: t(languageCode, 'micDenied'),
              detail: 'Allow microphone access in your browser settings, or type your question below.',
            }
          : {
              message: t(languageCode, 'error'),
              detail: 'No microphone was found. You can type your question below.',
            },
      )
      setPhase('error')
    }
  }, [cleanupAudio, languageCode, stopRecording, transcribe])

  const resetAll = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setPhase('idle')
    setTranscript('')
    setAnswer('')
    setTakeaways([])
    setError(null)
    setDemo(false)
    analyticsIdRef.current = null
  }, [])

  const handleMicPress = () => {
    if (phase === 'recording') stopRecording()
    else if (phase === 'idle' || phase === 'answered' || phase === 'error') startRecording()
  }

  const handlePlaybackEnd = useCallback((seconds) => {
    if (!analyticsIdRef.current) return
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: analyticsIdRef.current, playbackSeconds: seconds }),
    }).catch(() => {})
  }, [])

  const hintKey =
    phase === 'recording'
      ? 'listening'
      : phase === 'transcribing'
        ? 'transcribing'
        : phase === 'thinking'
          ? 'thinking'
          : 'tapToSpeak'

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-8 pt-6 min-h-[calc(100dvh-6.5rem)]">
      {/* Hero tagline */}
      <div className="mb-5 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Pakistan&apos;s voice-first MultiModel assistant,{' '}
          <span className="text-teal-400">for everyone.</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-teal-200/60">
          100% free · Urdu · Sindhi · Pashto · Punjabi · Balochi
        </p>
      </div>

      {/* Feature badges */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        {[
          { Icon: Sparkles, label: '100% Free' },
          { Icon: Globe, label: '5 Languages' },
          { Icon: Zap, label: 'No sign-up needed' },
        ].map(({ Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-teal-100 shadow-sm backdrop-blur"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {/* Language selector */}
      <button
        type="button"
        onClick={() => setShowLanguages(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-teal-500/20 bg-white/5 px-4 py-3 shadow-sm backdrop-blur transition hover:border-teal-400 hover:bg-white/[0.07]"
        aria-haspopup="dialog"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 text-white shadow-md shadow-teal-500/25">
          <Globe className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className={`block text-xl leading-snug text-white ${scriptClass(language)}`} dir="rtl">
            {language.native}
          </span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-teal-200/50">
            {language.name} · {language.region}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-teal-200/50" aria-hidden="true" />
      </button>

      {/* Category cards */}
      <div className="mt-5">
        <CategoryGrid active={category} onSelect={setCategory} languageCode={languageCode} />
        <AnimatePresence>
          {category && !busy && phase !== 'answered' && (
            <motion.button
              type="button"
              key="example-chip"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => askQuestion(exampleFor(category, languageCode))}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 text-left transition hover:shadow-sm"
              style={{ borderColor: category.color, backgroundColor: 'rgb(255 255 255 / 0.05)' }}
            >
              <Lightbulb className="h-5 w-5 shrink-0" style={{ color: category.color }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: category.color }}>
                  {t(languageCode, 'tryThis')}
                </span>
                <span className={`block truncate text-lg text-teal-50/90 ${scriptClass(language)}`} dir="rtl">
                  {exampleFor(category, languageCode)}
                </span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Main interactive area */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <div className="w-full max-w-md sm:max-w-lg">
          <AudioVisualizer
            analyser={analyser}
            active={phase === 'recording' || speaking}
            mode={phase === 'recording' && analyser ? 'input' : 'output'}
            color={phase === 'recording' ? '#F43F5E' : category?.color || language.color}
          />
        </div>
        <div className="mt-2">
          <MicButton phase={phase} onPress={handleMicPress} />
        </div>
        <div className="mt-5 min-h-10 text-center">
          <p
            className={`text-2xl font-bold text-white/90 sm:text-3xl ${scriptClass(language)} ${
              phase === 'recording' ? 'text-rose-400' : ''
            }`}
            dir="rtl"
          >
            {t(languageCode, hintKey)}
            {phase === 'recording' && (
              <span className="ms-2 align-middle text-base tabular-nums text-teal-200/50">
                {formatElapsed(elapsed)} / {formatElapsed(Math.floor(MAX_RECORDING_MS / 1000))}
              </span>
            )}
          </p>
        </div>
        {phase === 'recording' && transcript && (
          <p className={`mt-1 max-w-md px-4 text-center text-xl text-teal-200/60 ${scriptClass(language)}`} dir="rtl">
            {transcript}
          </p>
        )}
      </div>

      {/* Transcript / answer content */}
      <div className="w-full">
        <AnimatePresence>
          {(phase === 'thinking' || phase === 'answered') && transcript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 rounded-3xl border border-teal-500/20 bg-white/5 px-5 py-4 shadow-sm backdrop-blur"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200/50">
                {t(languageCode, 'youAsked')}
              </p>
              <p className={`mt-1 text-xl leading-relaxed text-teal-50 ${scriptClass(language)}`} dir="rtl">
                {transcript}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'error' && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 flex items-start gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5"
              role="alert"
            >
              <AlertCircle className="mt-1 h-7 w-7 shrink-0 text-amber-400" aria-hidden="true" />
              <div className="flex-1">
                <p className={`text-xl font-bold text-amber-100 ${scriptClass(language)}`} dir="rtl">
                  {error.message}
                </p>
                {error.detail && (
                  <p className="mt-1 text-sm font-medium text-amber-200/80">
                    {friendlyErrorDetail(error.detail)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-500"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {((phase === 'thinking' && answer) || phase === 'answered') && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <ResponseCard
                answer={answer}
                complete={phase === 'answered'}
                takeaways={takeaways}
                language={language}
                languageCode={languageCode}
                category={category}
                demo={demo}
                onAskAnother={() => {
                  resetAll()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onPlaybackEnd={handlePlaybackEnd}
                onPlayingChange={setSpeaking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom text input */}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const question = typed.trim()
          if (!question || busy) return
          setTyped('')
          askQuestion(question)
        }}
        className="mt-auto"
      >
        <div className="relative flex items-center rounded-full border border-teal-500/20 bg-white/5 px-5 py-3 shadow-sm backdrop-blur transition focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20">
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            dir="auto"
            placeholder={t(languageCode, 'typeHint')}
            className="h-10 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-teal-200/40"
            aria-label="Type your question"
          />
          <button
            type="submit"
            disabled={!typed.trim() || busy}
            className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 text-white shadow-md shadow-teal-500/25 transition hover:from-teal-300 hover:to-emerald-300 disabled:opacity-40"
            aria-label="Send question"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>

      <LanguageModal
        open={showLanguages}
        current={languageCode}
        onSelect={changeLanguage}
        onClose={() => setShowLanguages(false)}
      />
    </div>
  )
}
