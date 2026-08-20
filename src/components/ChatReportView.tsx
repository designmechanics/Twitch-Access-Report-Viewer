import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MessageSquare, Search, Filter, Sparkles, BarChart2, Calendar, Radio } from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface ChatReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const ChatReportView: React.FC<ChatReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartDimension, setChartDimension] = useState<'channels' | 'timeline' | 'hourOfDay'>('channels');

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

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.rows) {
      const ch = r.channel_name || r.channel || r.recipient || r.target_channel;
      if (ch) set.add(String(ch));
    }
    return Array.from(set).sort();
  }, [data.rows]);

  const filteredRows = useMemo(() => {
    return data.rows.filter((r) => {
      const channel = String(r.channel_name || r.channel || r.recipient || r.target_channel || '');
      const content = String(r.message_content || r.body || r.message || r.text || '');
      const matchesChannel = channelFilter === 'all' || channel.toLowerCase() === channelFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesChannel && matchesSearch;
    });
  }, [data.rows, channelFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = data.rows.length;
    const channelCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    for (const r of data.rows) {
      const ch = String(r.channel_name || r.channel || 'unknown');
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;

      const rawDate = String(r.timestamp || r.date || r.created_at || '');
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().slice(0, 10);
            dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
            const hour = d.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        } catch {
          // ignore
        }
      }
    }

    const sortedChannels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
    const topChannel = sortedChannels[0] ? sortedChannels[0][0] : 'None';
    const topChannelCount = sortedChannels[0] ? sortedChannels[0][1] : 0;

    // Channel chart points
    const channelChartData: ChartDataPoint[] = sortedChannels.slice(0, 20).map(([channel, count], i) => ({
      label: channel,
      value: count,
      secondaryValue: i + 1,
      category: `${count.toLocaleString()} messages in #${channel}`
    }));

    // Timeline chart points
    const timelineChartData: ChartDataPoint[] = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        label: date,
        value: count,
        category: 'Daily Chat Messages',
        date
      }));

    // Hour of day distribution
    const hourChartData: ChartDataPoint[] = Array.from({ length: 24 }, (_, h) => {
      const count = hourCounts[h] || 0;
      const ampm = h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h === 0 ? 12 : h} AM`;
      return {
        label: ampm,
        value: count,
        category: `Activity at ${ampm}`
      };
    });

    return {
      total,
      uniqueChannels: channels.length,
      topChannel,
      topChannelCount,
      sortedChannels,
      channelChartData,
      timelineChartData,
      hourChartData
    };
  }, [data.rows, channels]);

  const activeChartData =
    chartDimension === 'channels'
      ? stats.channelChartData
      : chartDimension === 'timeline'
      ? stats.timelineChartData
      : stats.hourChartData;

  const activeChartTitle =
    chartDimension === 'channels'
      ? 'Most Chatted Channels (Message Volume vs Channel)'
      : chartDimension === 'timeline'
      ? 'Chat Messages Logged Over Time (Timeline)'
      : 'Chatting Activity by Hour of Day';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Messages
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.total.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Across all channels</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Most Chatted Channel
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            #{stats.topChannel}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.topChannelCount.toLocaleString()} messages ({stats.total > 0 ? Math.round((stats.topChannelCount / stats.total) * 100) : 0}%)
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Streamers Chatted In
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.uniqueChannels}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Unique chatrooms</p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs font-mono">
            <button
              onClick={() => setChartDimension('channels')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'channels'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Channels (3D Volume)
            </button>
            <button
              onClick={() => setChartDimension('timeline')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'timeline'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Timeline Over Time
            </button>
            <button
              onClick={() => setChartDimension('hourOfDay')}
              className={`cursor-pointer px-3 py-1 rounded transition-colors ${
                chartDimension === 'hourOfDay'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Time of Day
            </button>
          </div>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Messages"
          metricLabel="Messages Sent"
          defaultStyle={defaultChartStyle}
          height={330}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="stagger-card flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chat content or channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 focus:border-[#9146FF] focus:outline-none rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 font-mono">Channel:</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-[#18181B] border border-white/10 text-gray-200 text-xs rounded px-2.5 py-1 focus:border-[#9146FF] focus:outline-none cursor-pointer font-mono"
          >
            <option value="all">All Channels ({channels.length})</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table view matching design layout */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Timestamp
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Channel
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Message
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Type / Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-sans">
                    No chat messages match your query.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const channel = String(row.channel_name || row.channel || row.recipient || 'general');
                  const timestamp = String(row.timestamp || row.date || row.created_at || '');
                  const content = String(row.message_content || row.body || row.message || row.text || '');
                  const isAction = row.is_action === true || String(row.is_action) === 'true';
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-white/5 transition-colors ${
                        isEven ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {timestamp ? new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td className="p-3 text-white font-semibold whitespace-nowrap">
                        {channel}
                      </td>
                      <td className="p-3 text-gray-300 font-sans break-words max-w-lg">
                        {content}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {isAction ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/30">
                            ACTION
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">chat</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
