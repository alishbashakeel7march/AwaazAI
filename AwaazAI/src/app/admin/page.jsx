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
  ChevronRight,
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
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Supabase is not configured yet.');
        setAuthed(true);
        setData(null);
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
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-900/10 border border-brand-100 p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-ink text-center">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-ink/50 text-center">
            Enter the admin password to view usage analytics.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-brand-100 focus:border-brand-500 focus:outline-none text-ink placeholder:text-ink/30 text-lg"
            />
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:from-brand-700 hover:to-brand-800 transition-all active:scale-[0.98]"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
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
          color: 'from-brand-500 to-brand-700',
        },
        {
          label: 'Total Unique Users',
          value: data.uniqueUsers?.toLocaleString() ?? '0',
          icon: Users,
          color: 'from-cyan-500 to-cyan-700',
        },
        {
          label: 'Avg AI Response Time',
          value: data.avgResponseMs ? `${(data.avgResponseMs / 1000).toFixed(2)}s` : '—',
          icon: Zap,
          color: 'from-amber-500 to-amber-600',
        },
      ]
    : [];

  const languages = data?.byLanguage ?? [];
  const categories = data?.byCategory ?? [];
  const recent = data?.recent ?? [];
  const maxCategory = Math.max(1, ...categories.map((c) => c.count));

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
              <p className="text-sm text-ink/50">
                {data?.configured
                  ? `Live · updates every ${POLL_INTERVAL_MS / 1000}s`
                  : 'Analytics inactive'}
                {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(password)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-brand-100 text-brand-700 font-semibold flex items-center gap-2 hover:border-brand-300 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setAuthed(false);
                setData(null);
                setError(null);
                setPassword('');
              }}
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-brand-100 text-ink/60 font-semibold hover:border-rose-200 hover:text-rose-600 transition-all"
            >
              Log out
            </button>
          </div>
        </div>

        {error && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">Analytics not available</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}
                  >
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-ink">{s.value}</p>
                  <p className="text-sm text-ink/50 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-bold text-ink mb-6">
                  <Globe className="w-5 h-5 text-brand-600" />
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

              <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-bold text-ink mb-6">
                  <LayoutGrid className="w-5 h-5 text-brand-600" />
                  Top Categories
                </h2>
                {categories.length === 0 ? (
                  <p className="text-ink/40 text-sm">No queries yet.</p>
                ) : (
                  <div className="space-y-5">
                    {categories.map((c) => {
                      const cat = getCategory(c.value);
                      const pct = Math.round((c.count / (data.totalQueries || 1)) * 100);
                      return (
                        <div key={c.value}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-semibold text-ink capitalize flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                              />
                              {cat?.name ?? c.value}
                            </span>
                            <span className="text-ink/50">
                              {c.count} queries · {pct}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-ink/5 overflow-hidden">
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

            <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold text-ink mb-4">
                <Clock className="w-5 h-5 text-brand-600" />
                Real-Time Query Logs
                <span className="ml-auto text-xs font-normal text-ink/40">
                  Last {recent.length} queries
                </span>
              </h2>
              {recent.length === 0 ? (
                <p className="text-ink/40 text-sm py-8 text-center">
                  No queries logged yet. Ask a question on the home page to see it appear here.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-left text-ink/40 border-b border-brand-100">
                        <th className="px-2 pb-3 font-medium">Time</th>
                        <th className="px-2 pb-3 font-medium">Language</th>
                        <th className="px-2 pb-3 font-medium">Category</th>
                        <th className="px-2 pb-3 font-medium">Question</th>
                        <th className="px-2 pb-3 font-medium text-right">AI Time</th>
                        <th className="px-2 pb-3 font-medium text-right">Playback</th>
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
                            className="border-b border-brand-50 hover:bg-brand-50/40"
                          >
                            <td className="px-2 py-3 text-ink/60 whitespace-nowrap">
                              {new Date(row.created_at).toLocaleString()}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 font-semibold"
                                style={{ color: lang?.color }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: lang?.color }}
                                />
                                {lang?.name ?? row.language}
                              </span>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              {cat ? (
                                <span
                                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                  style={{ backgroundColor: cat.color }}
                                >
                                  {cat.name}
                                </span>
                              ) : (
                                <span className="text-ink/30">—</span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-ink/70 max-w-[280px] truncate" dir="auto">
                              {row.question || '—'}
                            </td>
                            <td className="px-2 py-3 text-right text-ink/60 whitespace-nowrap">
                              {row.response_duration_ms
                                ? `${(row.response_duration_ms / 1000).toFixed(1)}s`
                                : '—'}
                            </td>
                            <td className="px-2 py-3 text-right text-ink/60 whitespace-nowrap">
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
    return <p className="text-ink/40 text-sm">No queries yet.</p>;
  }

  const size = 200;
  const radius = 80;
  const innerRadius = 52;
  const center = size / 2;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const restCount = sorted.slice(5).reduce((s, d) => s + d.value, 0);
  const slices = restCount > 0 ? [...top, { label: 'Other', native: 'Other', value: restCount, color: '#94a3b8' }] : top;

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
    <div className="flex flex-col sm:flex-row items-center gap-8">
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
        <circle cx={center} cy={center} r={innerRadius - 6} fill="white" />
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
      <div className="space-y-3 w-full">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-sm">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="font-semibold text-ink">{a.label}</span>
              <span className="text-ink/40" dir="rtl">{a.native !== a.label ? a.native : ''}</span>
            </span>
            <span className="text-sm text-ink/50 whitespace-nowrap">
              {a.value} · {a.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
