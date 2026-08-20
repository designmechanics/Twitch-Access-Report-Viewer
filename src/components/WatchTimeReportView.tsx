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
  Sparkles
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

interface WatchTimeReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
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
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<
    'timeline' | 'streamers' | 'categories' | 'devices'
  >('timeline');
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'month'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<WatchRecord | null>(null);

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

  // Normalized records
  const records: WatchRecord[] = useMemo(() => {
    return data.rows.map((r) => {
      const streamer = extractStreamerName(r, 'General Streamer');
      const mins = Number(
        r.minutes_watched ||
          r.duration_minutes ||
          r.minutes ||
          r.watch_time ||
          (r.duration_seconds ? Number(r.duration_seconds) / 60 : 0) ||
          0
      );
      const safeMins = isNaN(mins) ? 0 : mins;
      const category = String(r.category_name || r.game || r.category || 'General Broadcast').trim();
      const device = String(r.device_type || r.client_platform || r.device || r.platform || 'Desktop / Web').trim();
      const rawDate = r.date || r.timestamp || r.watch_date || r.time || r.started_at;
      const title = r.title || r.stream_title || r.broadcast_title || undefined;

      return {
        streamer,
        channelUrl: `https://twitch.tv/${streamer.toLowerCase()}`,
        category,
        minutes: safeMins,
        hours: +(safeMins / 60).toFixed(1),
        date: rawDate ? String(rawDate) : undefined,
        device,
        title: title ? String(title) : undefined,
        rawRow: r
      };
    });
  }, [data.rows]);

  const analytics = useMemo(() => {
    let totalMinutes = 0;
    const channelWatch: Record<string, number> = {};
    const categoryWatch: Record<string, number> = {};
    const deviceWatch: Record<string, number> = {};
    const dateWatch: Record<string, number> = {};
    const monthWatch: Record<string, number> = {};

    for (const r of records) {
      totalMinutes += r.minutes;
      channelWatch[r.streamer] = (channelWatch[r.streamer] || 0) + r.minutes;
      categoryWatch[r.category] = (categoryWatch[r.category] || 0) + r.minutes;
      deviceWatch[r.device] = (deviceWatch[r.device] || 0) + r.minutes;

      if (r.date) {
        try {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            const dayKey = d.toISOString().slice(0, 10);
            const monthKey = d.toISOString().slice(0, 7);
            dateWatch[dayKey] = (dateWatch[dayKey] || 0) + r.minutes;
            monthWatch[monthKey] = (monthWatch[monthKey] || 0) + r.minutes;
          }
        } catch {
          // ignore
        }
      }
    }

    const topChannels = Object.entries(channelWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topCategories = Object.entries(categoryWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topDevices = Object.entries(deviceWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const timelineData: ChartDataPoint[] = Object.entries(
      timeGranularity === 'day' ? dateWatch : monthWatch
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, mins]) => ({
        label: date,
        value: mins,
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

    const devicesData: ChartDataPoint[] = topDevices.map((d) => ({
      label: d.name,
      value: d.mins,
      secondaryValue: d.hours,
      category: `${d.hours} hrs on ${d.name}`
    }));

    return {
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(1),
      topChannels,
      topCategories,
      topDevices,
      effectiveTimeline,
      streamersData,
      categoriesData,
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
        const matchesTitle = r.title?.toLowerCase().includes(q);
        return matchesStreamer || matchesCategory || matchesDevice || matchesTitle;
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
      : analytics.devicesData;

  const activeChartTitle =
    chartDimension === 'timeline'
      ? 'Minutes Watched Over Time (Trend Analysis)'
      : chartDimension === 'streamers'
      ? 'Top Streamers by Total Minutes Watched (3D)'
      : chartDimension === 'categories'
      ? 'Top Game Categories by Broadcast Minutes'
      : 'Watch Time by Device & Platform';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Hours Watched
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {analytics.totalHours.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-500 font-sans">hrs</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.totalMinutes.toLocaleString()} minutes logged
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer
          </p>
          <p className="text-xl font-mono font-bold text-[#bf94ff] mt-1 truncate" title={analytics.topChannels[0]?.name}>
            {analytics.topChannels[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.topChannels[0]?.hours || 0} hrs watched
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Category
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1 truncate" title={analytics.topCategories[0]?.name}>
            {analytics.topCategories[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.topCategories[0]?.hours || 0} hrs total
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Distinct Channels
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {analytics.topChannels.length}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Broadcasts viewed</p>
        </div>
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
            placeholder="Search by streamer, game, title, or platform..."
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
                    <div
                      className={`w-6 h-6 rounded-md bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                    >
                      {ch.name.slice(0, 2).toUpperCase()}
                    </div>
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
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Watch Activity Records</span>
          </h3>
          <span className="text-xs font-mono text-gray-400">
            {filteredRecords.length} records
          </span>
        </div>
        <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Channel</th>
                <th className="border-b border-white/10 p-3 font-semibold">Game / Category</th>
                <th className="border-b border-white/10 p-3 font-semibold">Watch Duration</th>
                <th className="border-b border-white/10 p-3 font-semibold">Device Platform</th>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRecords.slice(0, 100).map((r, idx) => {
                const avatarColor = getStreamerAvatarColor(r.streamer);
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                        >
                          {r.streamer.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-white font-sans group-hover:text-[#bf94ff] transition-colors">
                          {r.streamer}
                        </span>
                        <a
                          href={r.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-gray-300 font-sans">{r.category}</td>
                    <td className="p-3 text-white font-bold whitespace-nowrap">
                      {r.hours} hrs <span className="text-gray-500 font-normal text-[11px]">({r.minutes}m)</span>
                    </td>
                    <td className="p-3 text-gray-400">{r.device}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {formatTwitchDate(r.date)}
                    </td>
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

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStreamerAvatarColor(
                    selectedRecord.streamer
                  )} flex items-center justify-center text-white font-bold text-xs`}
                >
                  {selectedRecord.streamer.slice(0, 2).toUpperCase()}
                </div>
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
                    Watch Duration
                  </span>
                  <span className="text-base font-bold text-white">
                    {selectedRecord.hours} Hours ({selectedRecord.minutes}m)
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

              {selectedRecord.title && (
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Stream Title
                  </span>
                  <span className="text-xs text-white font-sans">{selectedRecord.title}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Raw Log Row</span>
                <pre className="p-3 bg-[#121214] border border-white/5 rounded-xl text-[11px] overflow-x-auto text-gray-300">
                  {JSON.stringify(selectedRecord.rawRow, null, 2)}
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
