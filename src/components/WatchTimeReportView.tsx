import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Clock, Tv, Film, Monitor, Calendar, Sliders, TrendingUp, Layers } from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface WatchTimeReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const WatchTimeReportView: React.FC<WatchTimeReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'line',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'timeline' | 'streamers' | 'categories'>('timeline');
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'month'>('day');

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

  const analytics = useMemo(() => {
    let totalMinutes = 0;
    const channelWatch: Record<string, number> = {};
    const categoryWatch: Record<string, number> = {};
    const deviceWatch: Record<string, number> = {};
    const dateWatch: Record<string, number> = {};
    const monthWatch: Record<string, number> = {};

    for (const r of data.rows) {
      const mins = Number(r.minutes_watched || r.duration_minutes || r.minutes || r.watch_time || 0);
      totalMinutes += isNaN(mins) ? 0 : mins;

      const ch = String(r.channel_name || r.streamer || r.channel || 'Unknown Streamer');
      channelWatch[ch] = (channelWatch[ch] || 0) + mins;

      const cat = String(r.category_name || r.game || r.category || 'General Broadcast');
      categoryWatch[cat] = (categoryWatch[cat] || 0) + mins;

      const dev = String(r.device_type || r.client_platform || r.device || 'Desktop / Web');
      deviceWatch[dev] = (deviceWatch[dev] || 0) + mins;

      // Temporal parsing
      const rawDate = String(r.date || r.timestamp || r.watch_date || r.time || '');
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const dayKey = d.toISOString().slice(0, 10);
            const monthKey = d.toISOString().slice(0, 7);
            dateWatch[dayKey] = (dateWatch[dayKey] || 0) + mins;
            monthWatch[monthKey] = (monthWatch[monthKey] || 0) + mins;
          }
        } catch {
          // ignore date parse errors
        }
      }
    }

    const topChannels = Object.entries(channelWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topCategories = Object.entries(categoryWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const timelineData: ChartDataPoint[] = Object.entries(timeGranularity === 'day' ? dateWatch : monthWatch)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, mins]) => ({
        label: date,
        value: mins,
        secondaryValue: +(mins / 60).toFixed(1),
        category: 'Minutes Watched',
        date
      }));

    // If no dates present in CSV, fall back to top channels as timeline
    const effectiveTimeline: ChartDataPoint[] =
      timelineData.length > 0
        ? timelineData
        : topChannels.slice(0, 20).map((c) => ({
            label: c.name,
            value: c.mins,
            secondaryValue: c.hours,
            category: 'Top Streamer'
          }));

    const streamersData: ChartDataPoint[] = topChannels.slice(0, 20).map((c) => ({
      label: c.name,
      value: c.mins,
      secondaryValue: c.hours,
      category: `${c.hours} hrs watched`
    }));

    const categoriesData: ChartDataPoint[] = topCategories.slice(0, 20).map((c) => ({
      label: c.name,
      value: c.mins,
      secondaryValue: c.hours,
      category: `${c.hours} hrs watched`
    }));

    return {
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(1),
      topChannels,
      topCategories,
      effectiveTimeline,
      streamersData,
      categoriesData
    };
  }, [data.rows, timeGranularity]);

  const activeChartData =
    chartDimension === 'timeline'
      ? analytics.effectiveTimeline
      : chartDimension === 'streamers'
      ? analytics.streamersData
      : analytics.categoriesData;

  const activeChartTitle =
    chartDimension === 'timeline'
      ? 'Minutes Watched Over Time (Trend Analysis)'
      : chartDimension === 'streamers'
      ? 'Top Streamers by Total Minutes Watched'
      : 'Top Game Categories by Broadcast Minutes';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Hours Watched
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {analytics.totalHours.toLocaleString()} <span className="text-xs font-normal text-gray-500 font-sans">hrs</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.totalMinutes.toLocaleString()} minutes logged
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            {analytics.topChannels[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.topChannels[0]?.hours || 0} hrs watched
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Category
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1 truncate">
            {analytics.topCategories[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.topCategories[0]?.hours || 0} hrs total
          </p>
        </div>
      </div>

      {/* Primary 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs font-mono">
            <button
              onClick={() => setChartDimension('timeline')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'timeline'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Over-Time Trend
            </button>
            <button
              onClick={() => setChartDimension('streamers')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'streamers'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Top Streamers (3D)
            </button>
            <button
              onClick={() => setChartDimension('categories')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'categories'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Categories
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
          metricLabel="Minutes Watched"
          defaultStyle={defaultChartStyle}
          height={330}
        />
      </div>

      {/* Grid of rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-card">
        {/* Streamers */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Top Streamers Watched
            </h3>
            <span className="text-[10px] font-mono text-gray-500">Ranked by Hours</span>
          </div>

          <div className="divide-y divide-white/5 font-mono text-xs p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {analytics.topChannels.slice(0, 15).map((item, idx) => (
              <div key={item.name} className="py-2 px-3 flex items-center justify-between hover:bg-white/5 rounded transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-600 w-4 font-bold shrink-0">#{idx + 1}</span>
                  <span className="text-white font-semibold font-sans truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-gray-300 font-bold">{item.hours}h</span>
                  <span className="text-gray-600 text-[10px]">({item.mins}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Top Game Categories
            </h3>
            <span className="text-[10px] font-mono text-gray-500">Ranked by Hours</span>
          </div>

          <div className="divide-y divide-white/5 font-mono text-xs p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {analytics.topCategories.slice(0, 15).map((item, idx) => (
              <div key={item.name} className="py-2 px-3 flex items-center justify-between hover:bg-white/5 rounded transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-600 w-4 font-bold shrink-0">#{idx + 1}</span>
                  <span className="text-white font-semibold font-sans truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-gray-300 font-bold">{item.hours}h</span>
                  <span className="text-gray-600 text-[10px]">({item.mins}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

