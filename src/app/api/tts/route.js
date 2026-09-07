/**
 * Text-to-Speech proxy with two backends:
 *   1. Google Translate TTS (fast, free) — used for ur, pa, and anything else it supports.
 *   2. Microsoft Edge TTS via `edge-tts` CLI — fallback for languages Google
 *      doesn't cover (sd, ps). Spawns a Python child process on Node runtime.
 *
 * The client chunks long text (~180 chars) and calls this endpoint once per chunk.
 */
import { spawn } from 'child_process'
import { existsSync } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Preferred Edge TTS voice per language (high-quality neural voices).
const EDGE_VOICES = {
  sd: 'ur-PK-UzmaNeural', // Sindhi has no Edge voice; Urdu female reads Arabic script reasonably
  ps: 'ps-AF-GulNawazNeural',
  pa: 'ur-PK-AsadNeural', // Edge pa-IN is Gurmukhi; use Urdu for Shahmukhi
  ur: 'ur-PK-UzmaNeural',
  bal: 'ur-PK-UzmaNeural',
}

// Languages Google TTS handles well.
// Note: 'pa' (Punjabi) excluded — Google produces Gurmukhi pronunciation
// which misreads Shahmukhi/Arabic script. Edge TTS handles it better.
const GOOGLE_SUPPORTED = new Set(['ur', 'hi', 'ar', 'fa', 'en'])

async function fetchGoogleTTS(text, lang) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
    lang,
  )}&client=tw-ob&q=${encodeURIComponent(text)}`
  const upstream = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    },
  })
  if (!upstream.ok) return null
  const body = await upstream.arrayBuffer()
  if (body.byteLength < 200) return null
  return { body, contentType: upstream.headers.get('content-type') || 'audio/mpeg' }
}

function runEdgeTTS(text, voice) {
  return new Promise((resolve, reject) => {
    const candidates = [
      'edge-tts',
      `${process.env.APPDATA}\\Python\\Python314\\Scripts\\edge-tts.exe`,
      `${process.env.APPDATA}\\Python\\Python313\\Scripts\\edge-tts.exe`,
      `${process.env.APPDATA}\\Python\\Python312\\Scripts\\edge-tts.exe`,
      `${process.env.LOCALAPPDATA}\\Programs\\Python\\Python314\\Scripts\\edge-tts.exe`,
      'python',
    ]

    let cmd = candidates.find((c) => c && existsSync(c)) || 'edge-tts'
    let args
    if (cmd === 'python') {
      args = ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', '-']
    } else {
      args = ['--voice', voice, '--text', text, '--write-media', '-']
    }

    const chunks = []
    let stderr = ''
    const proc = spawn(cmd, args, { shell: cmd === 'python' })

    proc.stdout.on('data', (chunk) => chunks.push(chunk))
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    proc.on('error', (err) => reject(err))
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`edge-tts exit ${code}: ${stderr.slice(0, 200)}`))
        return
      }
      resolve(Buffer.concat(chunks))
    })

    // Hard timeout: 15s per chunk
    setTimeout(() => {
      try {
        proc.kill()
      } catch {
        // ignore
      }
      reject(new Error('edge-tts timeout'))
    }, 15000)
  })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const text = searchParams.get('q') || ''
  const lang = searchParams.get('tl') || 'ur'

  if (!text.trim()) {
    return new Response('missing q', { status: 400 })
  }

  // Try Google TTS first for supported languages.
  if (GOOGLE_SUPPORTED.has(lang)) {
    try {
      const result = await fetchGoogleTTS(text, lang)
      if (result) {
        return new Response(result.body, {
          status: 200,
          headers: {
            'content-type': result.contentType,
            'cache-control': 'public, max-age=3600',
          },
        })
      }
    } catch (err) {
      console.warn('[tts] Google TTS failed:', err?.message)
    }
  }

  // Fallback: Microsoft Edge TTS for sd, ps, bal, and anything Google missed.
  const voice = EDGE_VOICES[lang] || 'ur-PK-UzmaNeural'
  try {
    const audio = await runEdgeTTS(text, voice)
    if (!audio || audio.length < 200) {
      return new Response('edge-tts produced no audio', { status: 502 })
    }
    return new Response(audio, {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[tts] Edge TTS failed:', err?.message)
    return new Response(`tts error: ${err?.message || 'unknown'}`, { status: 502 })
  }
}
