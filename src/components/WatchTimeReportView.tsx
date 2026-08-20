import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Clock,
  Tv,
  Film,
  Monitor,
  Calendar,
  Sliders,
  TrendingUp,
  Layers,
  ExternalLink,
  Search,
  Filter,
  X,
  Smartphone,
  Globe,
  Sparkles,
  Zap,
  Info,
  ArrowRight,
  Split,
  Flame
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';
import {
  extractStreamerName,
  formatTwitchDate,
  getStreamerAvatarColor
} from '../utils/channelHelpers';
import { StreamerAvatar } from './StreamerAvatar';
import {
  inferPlaybackSessionsAndDurations,
  InferredPlaybackRecord,
  formatMinutesToHoursMinutes
} from '../utils/durationInference';

interface WatchTimeReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
  auditSampleSize?: number;
  auditShowAll?: boolean;
}

interface WatchRecord {
  streamer: string;
  channelUrl: string;
  category: string;
  minutes: number;
  hours: number;
  date?: string;
  device: string;
  title?: string;
  rawRow: Record<string, any>;
}

export const WatchTimeReportView: React.FC<WatchTimeReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'line',
  animateReveal = true,
  colorTheme = 'twitch',
  auditSampleSize = 15,
  auditShowAll = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<
    'timeline' | 'streamers' | 'categories' | 'sessions' | 'devices'
  >('timeline');
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'month'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<InferredPlaybackRecord | null>(null);
  const [showFirst15Audit, setShowFirst15Audit] = useState(false);

  // GSAP Stagger Reveal
  useEffect(() => {
    if (!animateReveal || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.stagger-card', {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [animateReveal, fileName]);

  // Reconstructed Sessions & Inferred Durations
  const inferenceSummary = useMemo(() => {
    return inferPlaybackSessionsAndDurations(data.rows);
  }, [data.rows]);

  const { records } = inferenceSummary;

  const auditRows = useMemo(() => {
    if (auditShowAll) {
      return records;
    }
    return records.slice(0, auditSampleSize || 15);
  }, [records, auditShowAll, auditSampleSize]);

  const analytics = useMemo(() => {
    let totalMinutes = 0;
    const channelWatch: Record<string, number> = {};
    const categoryWatch: Record<string, number> = {};
    const deviceWatch: Record<string, number> = {};
    const dateWatch: Record<string, number> = {};
    const monthWatch: Record<string, number> = {};
    const sessionSizes: Record<string, number> = {};

    for (const r of records) {
      totalMinutes += r.inferredMinutes;
      channelWatch[r.streamer] = (channelWatch[r.streamer] || 0) + r.inferredMinutes;
      categoryWatch[r.category] = (categoryWatch[r.category] || 0) + r.inferredMinutes;
      deviceWatch[r.device] = (deviceWatch[r.device] || 0) + r.inferredMinutes;

      const sessionKey = `Session #${r.sessionClusterId}`;
      sessionSizes[sessionKey] = (sessionSizes[sessionKey] || 0) + r.inferredMinutes;

      if (r.timestamp) {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            const dayKey = d.toISOString().slice(0, 10);
            const monthKey = d.toISOString().slice(0, 7);
            dateWatch[dayKey] = (dateWatch[dayKey] || 0) + r.inferredMinutes;
            monthWatch[monthKey] = (monthWatch[monthKey] || 0) + r.inferredMinutes;
          }
        } catch {
          // ignore
        }
      }
    }

    const topChannels = Object.entries(channelWatch)
      .map(([name, mins]) => ({ name, mins: +mins.toFixed(1), hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topCategories = Object.entries(categoryWatch)
      .map(([name, mins]) => ({ name, mins: +mins.toFixed(1), hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topDevices = Object.entries(deviceWatch)
      .map(([name, mins]) => ({ name, mins: +mins.toFixed(1), hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topSessions = Object.entries(sessionSizes)
      .map(([name, mins]) => ({ name, mins: +mins.toFixed(1), hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 20);

    const timelineData: ChartDataPoint[] = Object.entries(
      timeGranularity === 'day' ? dateWatch : monthWatch
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, mins]) => ({
        label: date,
        value: +mins.toFixed(1),
        secondaryValue: +(mins / 60).toFixed(1),
        category: `${+(mins / 60).toFixed(1)} hrs watched`,
        date
      }));

    const effectiveTimeline: ChartDataPoint[] =
      timelineData.length > 0
        ? timelineData
        : topChannels.slice(0, 20).map((c) => ({
            label: c.name,
            value: c.mins,
            secondaryValue: c.hours,
            category: 'Top Streamer'
          }));

    const streamersData: ChartDataPoint[] = topChannels.slice(0, 20).map((c, idx) => ({
      label: c.name,
      value: c.mins,
      secondaryValue: idx + 1,
      category: `${c.hours} hrs watched on ${c.name}`
    }));

    const categoriesData: ChartDataPoint[] = topCategories.slice(0, 20).map((c) => ({
      label: c.name,
      value: c.mins,
      secondaryValue: c.hours,
      category: `${c.hours} hrs in ${c.name}`
    }));

    const sessionsData: ChartDataPoint[] = topSessions.map((s) => ({
      label: s.name,
      value: s.mins,
      secondaryValue: s.hours,
      category: `${s.hours} hrs continuous session`
    }));

    const devicesData: ChartDataPoint[] = topDevices.map((d) => ({
      label: d.name,
      value: d.mins,
      secondaryValue: d.hours,
      category: `${d.hours} hrs on ${d.name}`
    }));

    return {
      totalMinutes: +totalMinutes.toFixed(1),
      totalHours: +(totalMinutes / 60).toFixed(1),
      topChannels,
      topCategories,
      topDevices,
      topSessions,
      effectiveTimeline,
      streamersData,
      categoriesData,
      sessionsData,
      devicesData
    };
  }, [records, timeGranularity]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesStreamer = r.streamer.toLowerCase().includes(q);
        const matchesCategory = r.category.toLowerCase().includes(q);
        const matchesDevice = r.device.toLowerCase().includes(q);
        const matchesDate = r.formattedDate.toLowerCase().includes(q);
        const matchesExp = r.calculationExplanation.toLowerCase().includes(q);
        return matchesStreamer || matchesCategory || matchesDevice || matchesDate || matchesExp;
      }
      return true;
    });
  }, [records, categoryFilter, searchQuery]);

  const activeChartData =
    chartDimension === 'timeline'
      ? analytics.effectiveTimeline
      : chartDimension === 'streamers'
      ? analytics.streamersData
      : chartDimension === 'categories'
      ? analytics.categoriesData
      : chartDimension === 'sessions'
      ? analytics.sessionsData
      : analytics.devicesData;

  const activeChartTitle =
    chartDimension === 'timeline'
      ? 'Minutes Watched Over Time (Trend Analysis)'
      : chartDimension === 'streamers'
      ? 'Top Streamers by Total Watch Time (3D)'
      : chartDimension === 'categories'
      ? 'Top Game Categories by Broadcast Minutes'
      : chartDimension === 'sessions'
      ? 'Longest Viewing Marathons & Continuous Sessions'
      : 'Watch Time by Device & Platform';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Total Watch Time
            </p>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                inferenceSummary.hasDirectDuration
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/30'
              }`}
            >
              {inferenceSummary.hasDirectDuration ? 'DIRECT LOGS' : 'INFERRED SWITCHES'}
            </span>
          </div>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {analytics.totalHours.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-500 font-sans">hrs</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.totalMinutes.toLocaleString()} mins calculated
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Channel Switches & Sessions
          </p>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {inferenceSummary.totalChannelSwitches}{' '}
            <span className="text-xs font-normal text-gray-500 font-sans">switches</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {inferenceSummary.sessionsCount} viewing sessions
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Longest Marathon
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1 truncate">
            {+(inferenceSummary.longestContinuousSessionMins / 60).toFixed(1)}{' '}
            <span className="text-xs font-normal text-gray-500 font-sans">hrs</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate flex items-center gap-1" title={inferenceSummary.longestSessionStreamer}>
            <span>on</span>
            <StreamerAvatar channelName={inferenceSummary.longestSessionStreamer} className="w-3.5 h-3.5 rounded-full inline-block shrink-0" />
            <span className="font-bold text-gray-300 truncate">{inferenceSummary.longestSessionStreamer}</span>
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Avg Session Chunk
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {formatMinutesToHoursMinutes(inferenceSummary.averageSessionDurationMins)}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">per stream visit</p>
        </div>
      </div>

      {/* Action Banner: First 15 Lines Calculation & Logical Flow Inspector */}
      <div className="stagger-card rounded-xl border border-[#9146FF]/30 bg-gradient-to-r from-[#9146FF]/10 via-[#18181B] to-cyan-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#bf94ff] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Logical Watch Duration Inference Engine
              </h4>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                Active
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5 max-w-xl">
              Chronologically evaluates time deltas between channel switches, continuous playback pings, and session boundaries.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFirst15Audit(true)}
          className="cursor-pointer px-3.5 py-2 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all shrink-0 hover:scale-[1.02]"
        >
          <Info className="w-3.5 h-3.5" />
          <span>
            {auditShowAll
              ? `Audit All Rows (${records.length}) Breakdown`
              : `Audit 1st ${auditSampleSize || 15} Rows Breakdown`}
          </span>
        </button>
      </div>

      {/* Primary 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-gray-500 px-2 py-0.5 font-bold uppercase tracking-wider">
              Dimension:
            </span>
            <button
              onClick={() => setChartDimension('timeline')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'timeline'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Over-Time Trend
            </button>
            <button
              onClick={() => setChartDimension('streamers')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'streamers'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Top Streamers (3D)
            </button>
            <button
              onClick={() => setChartDimension('categories')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'categories'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Game Categories
            </button>
            <button
              onClick={() => setChartDimension('sessions')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'sessions'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Marathon Sessions
            </button>
            <button
              onClick={() => setChartDimension('devices')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'devices'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Devices
            </button>
          </div>

          {chartDimension === 'timeline' && (
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/10 text-[11px] font-mono text-gray-400">
              <button
                onClick={() => setTimeGranularity('day')}
                className={`cursor-pointer px-2 py-0.5 rounded ${
                  timeGranularity === 'day' ? 'bg-white/15 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeGranularity('month')}
                className={`cursor-pointer px-2 py-0.5 rounded ${
                  timeGranularity === 'month' ? 'bg-white/15 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          )}
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Minutes"
          metricLabel="Minutes"
          defaultStyle={defaultChartStyle}
          height={330}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="stagger-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#18181B] border border-white/10 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by streamer, game, reasoning, date or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#9146FF] focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121214] border border-white/10 text-gray-200 rounded px-2.5 py-1 text-xs focus:border-[#9146FF] focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories ({analytics.topCategories.length})</option>
            {analytics.topCategories.slice(0, 15).map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.hours}h)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Streamers & Category Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-card">
        {/* Streamers Table */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-[#9146FF]" />
              <span>Top Streamers by Watch Duration</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {analytics.topChannels.length} Streamers
            </span>
          </div>
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {analytics.topChannels.slice(0, 30).map((ch, idx) => {
              const avatarColor = getStreamerAvatarColor(ch.name);
              const maxVal = analytics.topChannels[0]?.mins || 1;
              const pct = Math.round((ch.mins / maxVal) * 100);

              return (
                <div
                  key={idx}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-500 w-5">{idx + 1}</span>
                    <StreamerAvatar channelName={ch.name} className="w-6 h-6 rounded-md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate font-sans group-hover:text-[#bf94ff] transition-colors">
                          {ch.name}
                        </span>
                        <a
                          href={`https://twitch.tv/${ch.name.toLowerCase()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-white"
                          title="Open channel"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="w-32 sm:w-48 bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#9146FF] h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div className="text-xs font-bold font-mono text-white">
                      {ch.hours} <span className="text-[10px] font-sans text-gray-500">hrs</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      {ch.mins.toLocaleString()} min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Game & Content Categories</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {analytics.topCategories.length} Categories
            </span>
          </div>
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {analytics.topCategories.slice(0, 30).map((cat, idx) => {
              const maxVal = analytics.topCategories[0]?.mins || 1;
              const pct = Math.round((cat.mins / maxVal) * 100);

              return (
                <div
                  key={idx}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-500 w-5">{idx + 1}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate font-sans block">
                        {cat.name}
                      </span>
                      <div className="w-32 sm:w-48 bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {cat.hours} <span className="text-[10px] font-sans text-gray-500">hrs</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      {cat.mins.toLocaleString()} min
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Watch Log Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Enriched Playback Activity & Session Timeline
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {filteredRecords.length} records
          </span>
        </div>
        <div className="overflow-x-auto max-h-[520px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold w-12 text-center">#</th>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Channel</th>
                <th className="border-b border-white/10 p-3 font-semibold">Calculated Duration</th>
                <th className="border-b border-white/10 p-3 font-semibold">Duration Source</th>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp / Channel Switch</th>
                <th className="border-b border-white/10 p-3 font-semibold">Device Platform</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRecords.slice(0, 100).map((r) => {
                const avatarColor = getStreamerAvatarColor(r.streamer);
                return (
                  <tr
                    key={r.index}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-3 text-center text-gray-500">{r.index}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StreamerAvatar channelName={r.streamer} className="w-6 h-6 rounded" />
                        <span className="font-bold text-white font-sans group-hover:text-[#bf94ff] transition-colors">
                          {r.streamer}
                        </span>
                        <a
                          href={`https://twitch.tv/${r.streamer.toLowerCase()}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-white font-bold whitespace-nowrap">
                      {r.inferredHours > 0 ? `${r.inferredHours} hrs` : `${r.inferredMinutes}m`}{' '}
                      <span className="text-gray-500 font-normal text-[11px]">
                        ({formatMinutesToHoursMinutes(r.inferredMinutes)})
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {r.durationSource === 'channel_switch_delta' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/30 flex items-center gap-1 w-fit">
                          <Split className="w-3 h-3" /> SWITCH DELTA (Δ)
                        </span>
                      ) : r.durationSource === 'session_boundary' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          SESSION BOUNDARY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
                          DIRECT LOG
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-300 whitespace-nowrap">
                      <div>{r.formattedDate}</div>
                      {r.isChannelSwitch && r.nextStreamer && (
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <ArrowRight className="w-2.5 h-2.5 text-[#9146FF]" />
                          <span>Switched to {r.nextStreamer}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{r.device}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-[#9146FF] text-gray-300 hover:text-white text-[11px] font-sans"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* First 15 Lines Logical Duration Audit Modal */}
      {showFirst15Audit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 flex items-center justify-center text-[#bf94ff]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {auditShowAll
                      ? `All Rows (${auditRows.length}) Logical Watch Duration Breakdown`
                      : `1st ${auditSampleSize || 15} Rows Logical Watch Duration Breakdown`}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-400">
                    Step-by-step delta calculations and channel switch logic ({auditRows.length} rows analysed)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFirst15Audit(false)}
                className="cursor-pointer p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-gray-300">
              <div className="p-3.5 bg-[#121214] border border-white/10 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>How Watch Duration is Inferred:</span>
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  Twitch playback logs (such as <code className="text-[#bf94ff]">video_play.csv</code>) record discrete channel tune-ins and playback checkpoints. To construct a logical viewing timeline, we calculate the exact time elapsed between consecutive channel switches. If the gap between entries is under 3 hours, that delta is assigned as the active watch duration on that broadcaster.
                </p>
              </div>

              <div className="space-y-2">
                {auditRows.map((r) => (
                  <div
                    key={r.index}
                    className="p-3 rounded-xl border border-white/10 bg-[#121214] hover:border-[#9146FF]/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                          Row #{r.index}
                        </span>
                        <span className="font-bold text-white text-sm">{r.streamer}</span>
                        <span className="text-[11px] text-gray-500 font-sans">({r.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">
                          {formatMinutesToHoursMinutes(r.inferredMinutes)} ({r.inferredHours} hrs)
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            r.durationSource === 'channel_switch_delta'
                              ? 'bg-[#9146FF]/20 text-[#bf94ff]'
                              : r.durationSource === 'session_boundary'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {r.durationSource.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400">
                      <div>
                        <span className="text-gray-500">Timestamp: </span>
                        <span className="text-gray-200">{r.formattedDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Device / Platform: </span>
                        <span className="text-gray-200">{r.device}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-start gap-2 text-[11px]">
                      <ArrowRight className="w-3.5 h-3.5 text-[#9146FF] shrink-0 mt-0.5" />
                      <span className="text-gray-300 font-sans">
                        <strong className="text-white font-mono">Calculation:</strong> {r.calculationExplanation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#252529] flex justify-end">
              <button
                onClick={() => setShowFirst15Audit(false)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <StreamerAvatar channelName={selectedRecord.streamer} className="w-8 h-8 rounded-lg" />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedRecord.streamer}</h3>
                  <p className="text-[11px] font-mono text-gray-400">{selectedRecord.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="cursor-pointer p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 font-mono text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Calculated Watch Duration
                  </span>
                  <span className="text-base font-bold text-white">
                    {selectedRecord.inferredHours} Hours ({selectedRecord.inferredMinutes}m)
                  </span>
                </div>
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Device Platform
                  </span>
                  <span className="text-sm font-bold text-cyan-400">
                    {selectedRecord.device}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#121214] border border-white/5 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  Duration Reasoning & Formula
                </span>
                <p className="text-xs text-gray-200 font-sans">{selectedRecord.calculationExplanation}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Raw Log Row</span>
                <pre className="p-3 bg-[#121214] border border-white/5 rounded-xl text-[11px] overflow-x-auto text-gray-300">
                  {JSON.stringify(selectedRecord.originalRow, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#252529] flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
