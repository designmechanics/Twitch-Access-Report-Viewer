import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  ExternalLink,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  Award
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

interface ChannelPointsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

interface PointRecord {
  streamer: string;
  channelUrl: string;
  rewardTitle: string;
  pointsSpent: number;
  userInput?: string;
  status: string;
  isFulfilled: boolean;
  date?: string;
  rawRow: Record<string, any>;
}

export const ChannelPointsReportView: React.FC<ChannelPointsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true,
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'channels' | 'rewards' | 'timeline'>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PointRecord | null>(null);

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
  const records: PointRecord[] = useMemo(() => {
    return data.rows.map((r) => {
      const streamer = extractStreamerName(r, 'Twitch Channel');
      const pts = Number(r.points_spent || r.points || r.amount || r.cost || 0);
      const safePts = isNaN(pts) ? 0 : pts;
      const rewardTitle = String(r.reward_title || r.reward || r.title || 'Custom Reward').trim();
      const userInput = r.user_input || r.prompt_text || r.message || undefined;
      const rawStatus = String(r.status || r.fulfillment_status || 'Fulfilled').trim();
      const lower = rawStatus.toLowerCase();
      const isFulfilled = lower.includes('fulfill') || lower.includes('success') || lower.includes('complete');
      const date = r.redeemed_at || r.timestamp || r.date || r.created_at;

      return {
        streamer,
        channelUrl: `https://twitch.tv/${streamer.toLowerCase()}`,
        rewardTitle,
        pointsSpent: safePts,
        userInput: userInput ? String(userInput) : undefined,
        status: isFulfilled ? 'Fulfilled' : rawStatus || 'Completed',
        isFulfilled,
        date: date ? String(date) : undefined,
        rawRow: r
      };
    });
  }, [data.rows]);

  const stats = useMemo(() => {
    let totalSpent = 0;
    let fulfilledCount = 0;
    const channelSpent: Record<string, number> = {};
    const rewardSpent: Record<string, number> = {};
    const dateSpent: Record<string, number> = {};

    for (const r of records) {
      totalSpent += r.pointsSpent;
      channelSpent[r.streamer] = (channelSpent[r.streamer] || 0) + r.pointsSpent;
      rewardSpent[r.rewardTitle] = (rewardSpent[r.rewardTitle] || 0) + r.pointsSpent;

      if (r.isFulfilled) fulfilledCount++;

      if (r.date) {
        try {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().slice(0, 10);
            dateSpent[dateKey] = (dateSpent[dateKey] || 0) + r.pointsSpent;
          }
        } catch {
          // ignore
        }
      }
    }

    const channelChartData: ChartDataPoint[] = Object.entries(channelSpent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ch, pts], idx) => ({
        label: ch,
        value: pts,
        secondaryValue: idx + 1,
        category: `${pts.toLocaleString()} Points spent in #${ch}`
      }));

    const rewardChartData: ChartDataPoint[] = Object.entries(rewardSpent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([reward, pts]) => ({
        label: reward,
        value: pts,
        category: `${pts.toLocaleString()} Points spent on ${reward}`
      }));

    const timelineChartData: ChartDataPoint[] = Object.entries(dateSpent)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, pts]) => ({
        label: date,
        value: pts,
        category: `${pts.toLocaleString()} Points on ${date}`,
        date
      }));

    return {
      totalRedemptions: records.length,
      totalSpent,
      fulfilledCount,
      channelChartData,
      rewardChartData,
      timelineChartData
    };
  }, [records]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.streamer.toLowerCase().includes(q) ||
          r.rewardTitle.toLowerCase().includes(q) ||
          r.userInput?.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, searchQuery]);

  const activeChartData =
    chartDimension === 'channels'
      ? stats.channelChartData
      : chartDimension === 'rewards'
      ? stats.rewardChartData
      : stats.timelineChartData;

  const activeChartTitle =
    chartDimension === 'channels'
      ? 'Points Spent by Streamer Channel (Top Channels)'
      : chartDimension === 'rewards'
      ? 'Points Spent by Custom Reward Type'
      : 'Channel Points Spent Over Time (Timeline)';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Points Spent
          </p>
          <p className="text-xl font-mono font-bold text-[#bf94ff] mt-1">
            {stats.totalSpent.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Channel points</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Rewards Claimed
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {stats.totalRedemptions}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Redemptions</p>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Fulfilled
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {stats.fulfilledCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.totalRedemptions > 0
              ? Math.round((stats.fulfilledCount / stats.totalRedemptions) * 100)
              : 0}
            % completed
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer Channel
          </p>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1 truncate flex items-center gap-1.5" title={stats.channelChartData[0]?.label}>
            {stats.channelChartData[0]?.label && (
              <StreamerAvatar channelName={stats.channelChartData[0].label} className="w-5 h-5 rounded-md inline-block shrink-0" />
            )}
            <span className="truncate">{stats.channelChartData[0]?.label || 'N/A'}</span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.channelChartData.length} channels total
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono w-fit">
          <button
            onClick={() => setChartDimension('channels')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'channels'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Channels (3D Points)
          </button>
          <button
            onClick={() => setChartDimension('rewards')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'rewards'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Rewards
          </button>
          <button
            onClick={() => setChartDimension('timeline')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'timeline'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Points Timeline
          </button>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Points"
          metricLabel="Points"
          defaultStyle={defaultChartStyle}
          height={320}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search Toolbar */}
      <div className="stagger-card bg-[#18181B] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by streamer, reward title, message prompt, or status..."
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

        <div className="text-xs font-mono text-gray-400">
          Showing <span className="text-white font-bold">{filteredRecords.length}</span> redemptions
        </div>
      </div>

      {/* Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Channel</th>
                <th className="border-b border-white/10 p-3 font-semibold">Reward Title</th>
                <th className="border-b border-white/10 p-3 font-semibold">Points Cost</th>
                <th className="border-b border-white/10 p-3 font-semibold">Status</th>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp</th>
                <th className="border-b border-white/10 p-3 font-semibold">Prompt / Input</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRecords.map((row, idx) => {
                const avatarColor = getStreamerAvatarColor(row.streamer);
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
                        <StreamerAvatar channelName={row.streamer} className="w-6 h-6 rounded" />
                        <span className="text-white font-bold font-sans group-hover:text-[#bf94ff] transition-colors">
                          {row.streamer}
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
                    <td className="p-3 text-gray-200 font-sans font-medium">
                      {row.rewardTitle}
                    </td>
                    <td className="p-3 text-cyan-400 font-bold whitespace-nowrap">
                      {row.pointsSpent.toLocaleString()} pts
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          row.isFulfilled
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {formatTwitchDate(row.date)}
                    </td>
                    <td className="p-3 text-gray-300 font-sans break-words max-w-xs">
                      {row.userInput || <span className="text-gray-600 italic">-</span>}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
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
                <StreamerAvatar channelName={selectedRecord.streamer} className="w-8 h-8 rounded-lg" />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedRecord.streamer}</h3>
                  <p className="text-[11px] font-mono text-gray-400">{selectedRecord.rewardTitle}</p>
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
                    Points Cost
                  </span>
                  <span className="text-base font-bold text-cyan-400">
                    {selectedRecord.pointsSpent.toLocaleString()} Pts
                  </span>
                </div>
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Fulfillment Status
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedRecord.status}
                  </span>
                </div>
              </div>

              {selectedRecord.userInput && (
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Custom Prompt / Response Text
                  </span>
                  <span className="text-xs text-white font-sans">{selectedRecord.userInput}</span>
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
