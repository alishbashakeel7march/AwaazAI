# AwaazAI — آواز · Voice for Everyone

A 100% free, voice-first AI assistant for regional language speakers and low-literacy populations in Pakistan. Users **speak** in Urdu, Pashto, Sindhi, Punjabi, or Balochi, and AwaazAI answers **out loud** — no typing, no reading, no sign-up.

Built with Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, and Lucide icons. Installable as a PWA.

---

## What it does

1. **Speak** — Tap the giant mic button and ask a question in your own language/dialect.
2. **Understand** — Audio is transcribed with Groq Whisper (`whisper-large-v3`); the browser's built-in Web Speech API is a live fallback.
3. **Answer** — A multilingual LLM (Qwen via Alibaba ModelStudio, or Groq Llama 3.3) replies in the user's language with short spoken sentences plus 3 visual key takeaways.
4. **Speak back** — The answer plays automatically via text-to-speech, with Play Again / Pause / Ask Another controls.

Three focus categories with dedicated shortcuts:

| Category | Covers |
|---|---|
| **Healthcare Guidance** 🩺 | symptoms, maternal & child health, nutrition, when to see a doctor |
| **Financial Literacy** 💰 | banking, mobile wallets, loans, budgeting, scams |
| **Civic & Legal Rights** ⚖️ | ID documents, voting, property rights, legal help |

## Zero-key demo mode

The app runs **without any API keys** — perfect for hackathon judging. Without keys, `/api/ai` streams a localized sample answer (badged "Demo Mode"), and all UI flows (recording visualizer, language selector, categories, TTS playback) work end-to-end. Add keys to go live.

---

## Quick start (local)

```bash
npm install
cp .env.local.example .env.local   # optional — fill in keys, or leave blank for demo mode
npm run dev
```

Open http://localhost:3000. Admin dashboard: http://localhost:3000/admin (default password `awaaz2026`, set `ADMIN_PASSWORD` to change).

## Environment variables

All optional — see `.env.local.example`.

| Variable | Purpose | Provider |
|---|---|---|
| `GROQ_API_KEY` | Voice transcription (Whisper large-v3) + LLM fallback | [Groq](https://console.groq.com) |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Qwen LLM (OpenAI-compatible endpoint) | [Alibaba ModelStudio](https://modelstudio.alibaba.com) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Admin dashboard analytics | [Supabase](https://supabase.com) |
| `ADMIN_PASSWORD` | Password for `/admin` (default `awaaz2026`) | — |

Priority for the AI provider: `AI_API_KEY` (Qwen) → `GROQ_API_KEY` (Llama 3.3) → demo mode.

## Supabase setup (admin analytics)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run:

```sql
create table if not exists public.queries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  language text not null,
  category text,
  question text,
  answer text,
  response_duration_ms integer,
  playback_seconds numeric
);

alter table public.queries enable row level security;

-- The app uses the service-role key (server-side only), so no
-- client policies are needed. Keep RLS enabled and never expose
-- the service-role key in the browser.
```

3. Copy **Project Settings → API → Project URL** and **service_role key** into `.env.local`.
4. Restart the dev server, then open `/admin`.

The dashboard shows total audio queries, unique users, average AI response time, a dialect pie chart, top categories, and a live logs table (auto-refreshes every 10s) with timestamps, language, category, question, AI time, and voice playback duration.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add the environment variables (all optional — leave empty for demo mode) under **Environment Variables**.
4. Deploy. Done — no extra build config needed.

**For judges:** the deployed URL works immediately in demo mode. To experience live voice recognition and real AI answers, add a free `GROQ_API_KEY` (takes ~2 minutes at console.groq.com).

## Project structure

```
src/
├── app/
│   ├── layout.jsx           # Root layout, metadata, PWA hooks
│   ├── page.jsx             # Voice assistant UI (record → transcribe → answer → speak)
│   ├── admin/page.jsx       # Password-protected analytics dashboard
│   ├── globals.css          # Tailwind v4 theme, fonts (Nastaliq/Naskh for RTL scripts)
│   └── api/
│       ├── stt/route.js     # Groq Whisper transcription
│       ├── ai/route.js      # Streaming LLM answers (+ demo mode)
│       └── analytics/route.js # Supabase logging + admin stats
├── components/
│   ├── MicButton.jsx        # Giant animated mic button
│   ├── AudioVisualizer.jsx  # Live soundwave (canvas)
│   ├── LanguageModal.jsx    # Visual dialect selector
│   ├── CategoryGrid.jsx     # Healthcare / Finance / Legal cards
│   └── ResponseCard.jsx     # Spoken answer + key takeaways + playback controls
└── lib/
    ├── languages.js         # Urdu, Pashto, Sindhi, Punjabi, Balochi config + UI strings
    └── supabase.js          # Nullable server-side Supabase client
public/
├── manifest.json            # PWA manifest with category shortcuts
├── sw.js                    # Service worker (offline shell)
└── icons/icon-1024.png
```

## How STT / TTS fallbacks work

- **STT:** Recording is captured with `MediaRecorder` and sent to `/api/stt` (Groq Whisper). If no key is configured or the request fails, the app transparently falls back to the browser's `SpeechRecognition` (Web Speech API), hinted with the selected language code.
- **Balochi** isn't yet supported by Whisper/browser speech engines, so its audio runs through Urdu speech models while the UI and answers stay labeled Balochi.
- **TTS:** Uses `speechSynthesis` with a voice matching the selected language; playback duration (minus paused time) is logged to analytics when the answer finishes.

## Tech stack

- **Next.js 15** App Router + **React 19**
- **Tailwind CSS v4** (CSS-first theme config)
- **Framer Motion** micro-interactions, **Lucide** icons
- **Groq** Whisper (STT) · **Qwen / Llama 3.3** (LLM, streaming) · **Web Speech API** (TTS + STT fallback)
- **Supabase** PostgreSQL (analytics) — nullable, server-only
- PWA: manifest + service worker, installable on Android/iOS
