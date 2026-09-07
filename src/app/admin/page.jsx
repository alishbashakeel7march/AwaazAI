'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  Users,
  MessageSquare,
  Zap,
  Globe,
  LayoutGrid,
  Clock,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { LANGUAGES, getLanguage, getCategory } from '@/lib/languages';

const POLL_INTERVAL_MS = 10000;

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  async function fetchStats(pass, silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'x-admin-password': pass },
        cache: 'no-store',
      });
      if (res.status === 401) {
        setError('Incorrect password. Try again.');
        setAuthed(false);
        return;
      }
      if (res.status === 503) {
        // Supabase not configured — show dashboard in demo state instead of an error banner.
        setAuthed(true);
        setData({ configured: false });
        setError(null);
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setData(json);
      setError(null);
      setAuthed(true);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!password.trim()) return;
    fetchStats(password.trim());
  }

  useEffect(() => {
    if (authed && data?.configured) {
      timerRef.current = setInterval(() => fetchStats(password, true), POLL_INTERVAL_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [authed, data?.configured, password]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!authed) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-start justify-center bg-cream px-6 pt-[18vh]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-teal-500/20 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-md"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold text-ink">Admin Dashboard</h1>
          <p className="mt-2 text-center text-sm text-ink/50">
            Enter the admin password to view usage analytics.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              className="w-full rounded-xl border-2 border-teal-500/20 bg-white/5 px-4 py-3.5 text-lg text-ink placeholder:text-ink/30 focus:border-teal-400 focus:outline-none"
            />
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-4 text-lg font-semibold text-white transition-all hover:from-teal-400 hover:to-emerald-400 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {loading ? 'Checking...' : 'Unlock Dashboard'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const stats = data
    ? [
        {
          label: 'Total Audio Queries',
          value: data.totalQueries?.toLocaleString() ?? '0',
          icon: MessageSquare,
          color: 'from-teal-400 to-emerald-500',
        },
        {
          label: 'Total Unique Users',
          value: data.uniqueUsers?.toLocaleString() ?? '0',
          icon: Users,
          color: 'from-cyan-400 to-cyan-600',
        },
        {
          label: 'Avg AI Response Time',
          value: data.avgResponseMs ? `${(data.avgResponseMs / 1000).toFixed(2)}s` : '—',
          icon: Zap,
          color: 'from-amber-400 to-amber-600',
        },
      ]
    : [];

  const languages = data?.byLanguage ?? [];
  const categories = data?.byCategory ?? [];
  const recent = data?.recent ?? [];
  const maxCategory = Math.max(1, ...categories.map((c) => c.count));

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-cream p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
              <p className="text-sm text-ink/50">
                {data?.configured
                  ? `Live · updates every ${POLL_INTERVAL_MS / 1000}s`
                  : 'Analytics demo mode — database not connected'}
                {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(password)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border-2 border-teal-500/20 bg-white/5 px-4 py-2.5 font-semibold text-teal-300 transition-all hover:border-teal-400/40 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setAuthed(false);
                setData(null);
                setError(null);
                setPassword('');
              }}
              className="rounded-xl border-2 border-teal-500/20 bg-white/5 px-4 py-2.5 font-semibold text-ink/60 transition-all hover:border-rose-500/30 hover:text-rose-300"
            >
              Log out
            </button>
          </div>
        </div>

        {!data?.configured && (
          <div className="flex items-start gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4 text-sm text-teal-200">
            <Database className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Analytics demo mode mein hai. Live data ke liye Supabase connect karein:
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-medium">SUPABASE_URL</code>
              aur
              <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-medium">SUPABASE_SERVICE_ROLE_KEY</code>
              .env.local mein daalein.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">Analytics not available</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-teal-500/20 bg-white/5 p-6 shadow-sm"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}
                  >
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-ink">{s.value}</p>
                  <p className="mt-1 text-sm text-ink/50">{s.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-teal-500/20 bg-white/5 p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 font-bold text-ink">
                  <Globe className="h-5 w-5 text-teal-400" />
                  Top Used Dialects
                </h2>
                <PieChart
                  data={languages.map((l) => ({
                    label: getLanguage(l.value)?.name ?? l.value,
                    native: getLanguage(l.value)?.native ?? l.value,
                    value: l.count,
                    color: getLanguage(l.value)?.color ?? '#94a3b8',
                  }))}
                />
              </div>

              <div className="rounded-2xl border border-teal-500/20 bg-white/5 p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 font-bold text-ink">
                  <LayoutGrid className="h-5 w-5 text-teal-400" />
                  Top Categories
                </h2>
                {categories.length === 0 ? (
                  <p className="text-sm text-ink/40">No queries yet.</p>
                ) : (
                  <div className="space-y-5">
                    {categories.map((c) => {
                      const cat = getCategory(c.value);
                      const pct = Math.round((c.count / (data.totalQueries || 1)) * 100);
                      return (
                        <div key={c.value}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-semibold capitalize text-ink">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                              />
                              {cat?.name ?? c.value}
                            </span>
                            <span className="text-ink/50">
                              {c.count} queries · {pct}%
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.count / maxCategory) * 100}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-teal-500/20 bg-white/5 p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
                <Clock className="h-5 w-5 text-teal-400" />
                Real-Time Query Logs
                <span className="ml-auto text-xs font-normal text-ink/40">
                  Last {recent.length} queries
                </span>
              </h2>
              {recent.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink/40">
                  No queries logged yet. Ask a question on the home page to see it appear here.
                </p>
              ) : (
                <div className="-mx-2 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-teal-500/20 text-left text-ink/40">
                        <th className="px-2 pb-3 font-medium">Time</th>
                        <th className="px-2 pb-3 font-medium">Language</th>
                        <th className="px-2 pb-3 font-medium">Category</th>
                        <th className="px-2 pb-3 font-medium">Question</th>
                        <th className="px-2 pb-3 text-right font-medium">AI Time</th>
                        <th className="px-2 pb-3 text-right font-medium">Playback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((row, i) => {
                        const lang = getLanguage(row.language);
                        const cat = getCategory(row.category);
                        return (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i, 10) * 0.03 }}
                            className="border-b border-teal-500/10 hover:bg-white/5"
                          >
                            <td className="whitespace-nowrap px-2 py-3 text-ink/60">
                              {new Date(row.created_at).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-2 py-3">
                              <span
                                className="inline-flex items-center gap-1.5 font-semibold"
                                style={{ color: lang?.color }}
                              >
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: lang?.color }}
                                />
                                {lang?.name ?? row.language}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-3">
                              {cat ? (
                                <span
                                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                                  style={{ backgroundColor: cat.color }}
                                >
                                  {cat.name}
                                </span>
                              ) : (
                                <span className="text-ink/30">—</span>
                              )}
                            </td>
                            <td className="max-w-[280px] truncate px-2 py-3 text-ink/70" dir="auto">
                              {row.question || '—'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right text-ink/60">
                              {row.response_duration_ms
                                ? `${(row.response_duration_ms / 1000).toFixed(1)}s`
                                : '—'}
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right text-ink/60">
                              {row.playback_seconds ? `${Math.round(row.playback_seconds)}s` : '—'}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <p className="text-sm text-ink/40">No queries yet.</p>;
  }

  const size = 200;
  const radius = 80;
  const innerRadius = 52;
  const center = size / 2;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const restCount = sorted.slice(5).reduce((s, d) => s + d.value, 0);
  const slices = restCount > 0 ? [...top, { label: 'Other', native: 'Other', value: restCount, color: '#64748b' }] : top;

  let angle = -Math.PI / 2;
  const arcs = slices.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const largeArc = sweep > Math.PI ? 1 : 0;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const x3 = center + innerRadius * Math.cos(end);
    const y3 = center + innerRadius * Math.sin(end);
    const x4 = center + innerRadius * Math.cos(start);
    const y4 = center + innerRadius * Math.sin(start);
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    const mid = (start + end) / 2;
    return {
      ...slice,
      path,
      pct: Math.round((slice.value / total) * 100),
      mid,
    };
  });

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {arcs.map((a) => (
          <motion.path
            key={a.label}
            d={a.path}
            fill={a.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'center' }}
          />
        ))}
        <circle cx={center} cy={center} r={innerRadius - 6} fill="#0A3231" />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          className="fill-ink text-2xl font-bold"
          style={{ fontSize: 26, fontWeight: 700 }}
        >
          {total.toLocaleString()}
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="fill-ink/40"
          style={{ fontSize: 10 }}
        >
          queries
        </text>
      </svg>
      <div className="w-full space-y-3">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-sm">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="font-semibold text-ink">{a.label}</span>
              <span className="text-ink/40" dir="rtl">{a.native !== a.label ? a.native : ''}</span>
            </span>
            <span className="whitespace-nowrap text-sm text-ink/50">
              {a.value} · {a.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
