import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-side Supabase client. Null when credentials are missing — every
 * consumer must handle that (the app stays fully functional, analytics
 * are simply skipped) so the project runs out-of-the-box for judges.
 */
export const supabase = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
