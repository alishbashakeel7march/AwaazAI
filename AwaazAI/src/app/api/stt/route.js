import { NextResponse } from 'next/server'
import { getLanguage } from '@/lib/languages'

export const dynamic = 'force-dynamic'

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const MAX_AUDIO_BYTES = 15 * 1024 * 1024

export async function POST(req) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const audio = form.get('audio')
  const language = String(form.get('language') || 'ur')

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'No audio received' }, { status: 400 })
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio clip too large' }, { status: 413 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Speech-to-text is not configured', fallback: 'web-speech' },
      { status: 503 },
    )
  }

  const lang = getLanguage(language)
  const payload = new FormData()
  payload.append('file', audio, 'audio.webm')
  payload.append('model', 'whisper-large-v3')
  payload.append('response_format', 'json')
  payload.append('temperature', '0')
  if (lang.whisperCode) payload.append('language', lang.whisperCode)

  let upstream
  try {
    upstream = await fetch(GROQ_STT_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: payload,
      signal: AbortSignal.timeout(60000),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the transcription service', fallback: 'web-speech' },
      { status: 502 },
    )
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return NextResponse.json(
      { error: 'Transcription failed', detail: detail.slice(0, 300) },
      { status: 502 },
    )
  }

  const data = await upstream.json().catch(() => ({}))
  const transcript = String(data.text || '').trim()
  if (!transcript) {
    return NextResponse.json(
      { error: 'Could not understand the audio', fallback: 'web-speech' },
      { status: 422 },
    )
  }

  return NextResponse.json({ transcript })
}
