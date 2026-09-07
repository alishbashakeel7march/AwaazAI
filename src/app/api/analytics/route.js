import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'awaaz2026'
}

function tally(rows, key) {
  const map = new Map()
  for (const row of rows) {
    const value = row[key] || 'general'
    map.set(value, (map.get(value) || 0) + 1)
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!supabase) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'supabase-not-configured' })
  }

  // Second call: update playback duration of an already-recorded query.
  if (body?.id && typeof body.playbackSeconds === 'number') {
    const seconds = Math.max(0, Math.min(600, Number(body.playbackSeconds.toFixed(1))))
    const { error } = await supabase
      .from('queries')
      .update({ playback_seconds: seconds })
      .eq('id', String(body.id).slice(0, 64))
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  const sessionId = String(body?.sessionId ?? '').slice(0, 64) || 'anonymous'
  const language = String(body?.language ?? 'ur').slice(0, 8)
  const category = body?.category ? String(body.category).slice(0, 24) : null
  const question = String(body?.question ?? '').slice(0, 1000)
  const answer = String(body?.answer ?? '').slice(0, 4000)
  const responseDurationMs = Number.isFinite(Number(body?.responseDurationMs))
    ? Math.max(0, Math.round(Number(body.responseDurationMs)))
    : null

  const { data, error } = await supabase
    .from('queries')
    .insert({
      session_id: sessionId,
      language,
      category,
      question,
      answer,
      response_duration_ms: responseDurationMs,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}

export async function GET(req) {
  const pwd = req.headers.get('x-admin-password') || ''
  if (pwd !== adminPassword()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json(
      {
        configured: false,
        error:
          'Supabase is not connected. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables (see README for the table schema).',
      },
      { status: 503 },
    )
  }

  const [recentResult, sessionResult] = await Promise.all([
    supabase
      .from('queries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('queries').select('session_id').limit(10000),
  ])

  if (recentResult.error) {
    return NextResponse.json(
      { configured: true, error: recentResult.error.message },
      { status: 500 },
    )
  }

  const rows = recentResult.data || []
  const durations = rows
    .map((r) => r.response_duration_ms)
    .filter((d) => Number.isFinite(d) && d > 0)
  const avgResponseMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0
  const uniqueUsers = new Set((sessionResult.data || []).map((r) => r.session_id)).size

  return NextResponse.json({
    configured: true,
    totalQueries: recentResult.count ?? rows.length,
    uniqueUsers,
    avgResponseMs,
    byLanguage: tally(rows, 'language'),
    byCategory: tally(rows, 'category'),
    recent: rows.slice(0, 100).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      language: r.language,
      category: r.category,
      question: r.question,
      response_duration_ms: r.response_duration_ms,
      playback_seconds: r.playback_seconds,
    })),
  })
}
