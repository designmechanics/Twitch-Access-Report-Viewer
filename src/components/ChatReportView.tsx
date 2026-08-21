import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Sparkles,
  BarChart2,
  Calendar,
  Radio,
  ExternalLink,
  X,
  Clock,
  Award,
  Smile,
  Zap
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

interface ChatReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

interface ChatRecord {
  channel: string;
  channelUrl: string;
  content: string;
  date?: string;
  badges?: string;
  bitsCheered?: number;
  rawRow: Record<string, any>;
}

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'does'
]);

export const ChatReportView: React.FC<ChatReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true,
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartDimension, setChartDimension] = useState<'channels' | 'timeline' | 'hourOfDay' | 'emotes'>('channels');
  const [selectedRecord, setSelectedRecord] = useState<ChatRecord | null>(null);

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
  const records: ChatRecord[] = useMemo(() => {
    return data.rows.map((r) => {
      const channel = extractStreamerName(r, 'Twitch Chat');
      const content = String(r.message_content || r.body || r.message || r.text || r.content || '').trim();
      const date = r.timestamp || r.date || r.created_at || r.time || r.sent_at;
      const badges = r.badges || r.badge_info || undefined;
      const bits = Number(r.bits_cheered || r.bits || 0);

      return {
        channel,
        channelUrl: `https://twitch.tv/${channel.toLowerCase()}`,
        content,
        date: date ? String(date) : undefined,
        badges: badges ? String(badges) : undefined,
        bitsCheered: isNaN(bits) ? 0 : bits,
        rawRow: r
      };
    });
  }, [data.rows]);

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.channel) set.add(r.channel);
    }
    return Array.from(set).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesChannel = channelFilter === 'all' || r.channel.toLowerCase() === channelFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.channel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesChannel && matchesSearch;
    });
  }, [records, channelFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = records.length;
    const channelCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const wordCounts: Record<string, number> = {};

    for (const r of records) {
      channelCounts[r.channel] = (channelCounts[r.channel] || 0) + 1;

      // Extract words / emotes
      const tokens = r.content.split(/\s+/);
      for (const rawToken of tokens) {
        const token = rawToken.replace(/^[^\w]+|[^\w]+$/g, '');
        if (token.length >= 2) {
          const lower = token.toLowerCase();
          if (!STOP_WORDS.has(lower)) {
            wordCounts[token] = (wordCounts[token] || 0) + 1;
          }
        }
      }

      if (r.date) {
        try {
          const d = new Date(r.date);
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

    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);

    // Channel chart points
    const channelChartData: ChartDataPoint[] = sortedChannels.slice(0, 20).map(([ch, count], i) => ({
      label: ch,
      value: count,
      secondaryValue: i + 1,
      category: `${count.toLocaleString()} messages in #${ch}`
    }));

    // Timeline chart points
    const timelineChartData: ChartDataPoint[] = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        label: date,
        value: count,
        category: `${count} Chat Messages on ${date}`,
        date
      }));

    // Hour of day distribution
    const hourChartData: ChartDataPoint[] = Array.from({ length: 24 }, (_, h) => {
      const count = hourCounts[h] || 0;
      const ampm = h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h === 0 ? 12 : h} AM`;
      return {
        label: ampm,
        value: count,
        category: `${count} Messages at ${ampm}`
      };
    });

    // Emotes / Keywords chart points
    const emoteChartData: ChartDataPoint[] = topWords.map(([word, count]) => ({
      label: word,
      value: count,
      category: `Used ${count.toLocaleString()} times in chat`
    }));

    return {
      total,
      uniqueChannels: channels.length,
      topChannel,
      topChannelCount,
      sortedChannels,
      topWords,
      channelChartData,
      timelineChartData,
      hourChartData,
      emoteChartData
    };
  }, [records, channels]);

  const activeChartData =
    chartDimension === 'channels'
      ? stats.channelChartData
      : chartDimension === 'timeline'
      ? stats.timelineChartData
      : chartDimension === 'emotes'
      ? stats.emoteChartData
      : stats.hourChartData;

  const activeChartTitle =
    chartDimension === 'channels'
      ? 'Top Streamer Channels by Chat Frequency (3D)'
      : chartDimension === 'timeline'
      ? 'Chat Volume Over Time (Timeline)'
      : chartDimension === 'emotes'
      ? 'Top Emotes & Chat Keywords Frequency'
      : 'Hourly Activity Heatmap (24-Hour Distribution)';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Messages Sent
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {stats.total.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Logged in archive</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Active Chat Rooms
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {stats.uniqueChannels}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Streamer communities</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer Room
          </p>
          <div className="text-xl font-mono font-bold text-[#bf94ff] mt-1 truncate flex items-center gap-1.5" title={stats.topChannel}>
            {stats.topChannel && (
              <StreamerAvatar channelName={stats.topChannel} className="w-5 h-5 rounded-md inline-block shrink-0" />
            )}
            <span className="truncate">#{stats.topChannel}</span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.topChannelCount.toLocaleString()} messages
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Emote / Term
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1 truncate" title={stats.topWords[0]?.[0] || 'N/A'}>
            {stats.topWords[0]?.[0] || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.topWords[0]?.[1]?.toLocaleString() || 0} occurrences
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono w-fit">
          <button
            onClick={() => setChartDimension('channels')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'channels'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Channels (3D Chat)
          </button>
          <button
            onClick={() => setChartDimension('timeline')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'timeline'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chat Timeline
          </button>
          <button
            onClick={() => setChartDimension('emotes')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'emotes'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Emotes & Terms
          </button>
          <button
            onClick={() => setChartDimension('hourOfDay')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'hourOfDay'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Time of Day (24h)
          </button>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Messages"
          metricLabel="Count"
          defaultStyle={defaultChartStyle}
          height={320}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="stagger-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#18181B] border border-white/10 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chat messages or channels..."
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
          <span className="text-gray-500">Channel:</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-[#121214] border border-white/10 text-gray-200 rounded px-2.5 py-1 text-xs focus:border-[#9146FF] focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels ({channels.length})</option>
            {channels.slice(0, 30).map((ch) => (
              <option key={ch} value={ch}>
                #{ch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Chat Rooms & Emotes Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-card">
        {/* Top Channels */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#9146FF]" />
              <span>Top Streamer Chat Rooms</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {stats.sortedChannels.length} Channels
            </span>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {stats.sortedChannels.slice(0, 20).map(([ch, count], idx) => {
              const maxVal = stats.sortedChannels[0]?.[1] || 1;
              const pct = Math.round((count / maxVal) * 100);
              const avatarColor = getStreamerAvatarColor(ch);

              return (
                <div
                  key={idx}
                  onClick={() => setChannelFilter(ch)}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-gray-500 w-5">{idx + 1}</span>
                    <StreamerAvatar channelName={ch} className="w-6 h-6 rounded" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate font-sans group-hover:text-[#bf94ff] transition-colors block">
                        #{ch}
                      </span>
                      <div className="w-28 sm:w-40 bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#9146FF] h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div className="text-xs font-bold font-mono text-white">
                      {count.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Emotes & Words */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Emotes & Chat Vocabulary</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {stats.topWords.length} Detected
            </span>
          </div>
          <div className="p-4 flex flex-wrap gap-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {stats.topWords.map(([word, count], idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(word)}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#9146FF]/20 border border-white/10 hover:border-[#9146FF]/40 text-xs font-mono text-gray-200 hover:text-white flex items-center gap-2 transition-all"
              >
                <span className="font-bold text-[#bf94ff]">{word}</span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-gray-400">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Room</th>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp</th>
                <th className="border-b border-white/10 p-3 font-semibold">Message Content</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRecords.slice(0, 150).map((row, idx) => {
                const avatarColor = getStreamerAvatarColor(row.channel);
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRecord(row)}
                    className={`hover:bg-white/5 transition-colors cursor-pointer group ${
                      isEven ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StreamerAvatar channelName={row.channel} className="w-6 h-6 rounded" />
                        <span className="text-white font-bold font-sans group-hover:text-[#bf94ff] transition-colors">
                          #{row.channel}
                        </span>
                        <a
                          href={row.channelUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {formatTwitchDate(row.date)}
                    </td>
                    <td className="p-3 text-gray-200 font-sans break-words max-w-lg">
                      {row.content}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-[#9146FF] text-gray-300 hover:text-white text-[11px] font-sans transition-colors"
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
                <StreamerAvatar channelName={selectedRecord.channel} className="w-8 h-8 rounded-lg" />
                <div>
                  <h3 className="text-sm font-bold text-white">#{selectedRecord.channel}</h3>
                  <p className="text-[11px] font-mono text-gray-400">
                    {formatTwitchDate(selectedRecord.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="cursor-pointer p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs text-gray-300">
              <div className="p-4 bg-[#121214] border border-white/5 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2">
                  Message Content
                </span>
                <p className="text-sm text-white font-sans leading-relaxed break-words">
                  "{selectedRecord.content}"
                </p>
              </div>

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
