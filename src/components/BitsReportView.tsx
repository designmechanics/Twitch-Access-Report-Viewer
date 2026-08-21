import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Gem,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Search,
  Filter,
  X,
  DollarSign,
  Calendar,
  MessageSquare,
  Award
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';
import {
  extractStreamerName,
  formatTwitchDate,
  formatCurrency,
  getStreamerAvatarColor
} from '../utils/channelHelpers';
import { StreamerAvatar } from './StreamerAvatar';

interface BitsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

interface BitRecord {
  streamer: string;
  channelUrl: string;
  bits: number;
  estValue: number;
  message: string;
  date?: string;
  orderId?: string;
  rawRow: Record<string, any>;
}

export const BitsReportView: React.FC<BitsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true,
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'streamers' | 'timeline' | 'tiers'>('streamers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BitRecord | null>(null);

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
  const records: BitRecord[] = useMemo(() => {
    return data.rows.map((r) => {
      const streamer = extractStreamerName(r, 'Twitch Broadcaster');
      const bits = Number(r.bits_amount || r.amount || r.bits || r.quantity || 0);
      const safeBits = isNaN(bits) ? 0 : bits;
      const message = String(r.cheer_message || r.message || r.memo || r.chat_message || '').trim();
      const date = r.timestamp || r.date || r.created_at || r.time;
      const orderId = r.order_id || r.transaction_id || r.id;

      return {
        streamer,
        channelUrl: `https://twitch.tv/${streamer.toLowerCase()}`,
        bits: safeBits,
        estValue: +(safeBits * 0.01).toFixed(2), // 100 bits = ~$1.00 USD value
        message,
        date: date ? String(date) : undefined,
        orderId: orderId ? String(orderId) : undefined,
        rawRow: r
      };
    });
  }, [data.rows]);

  const analytics = useMemo(() => {
    let totalBits = 0;
    const streamerBits: Record<string, number> = {};
    const dateBits: Record<string, number> = {};
    const tierCounts: Record<string, number> = {
      '1 - 99 Bits': 0,
      '100 - 499 Bits': 0,
      '500 - 999 Bits': 0,
      '1,000 - 4,999 Bits': 0,
      '5,000+ Bits': 0
    };

    for (const r of records) {
      totalBits += r.bits;
      streamerBits[r.streamer] = (streamerBits[r.streamer] || 0) + r.bits;

      if (r.bits >= 5000) tierCounts['5,000+ Bits']++;
      else if (r.bits >= 1000) tierCounts['1,000 - 4,999 Bits']++;
      else if (r.bits >= 500) tierCounts['500 - 999 Bits']++;
      else if (r.bits >= 100) tierCounts['100 - 499 Bits']++;
      else tierCounts['1 - 99 Bits']++;

      if (r.date) {
        try {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().slice(0, 10);
            dateBits[dateKey] = (dateBits[dateKey] || 0) + r.bits;
          }
        } catch {
          // ignore
        }
      }
    }

    const topStreamers = Object.entries(streamerBits)
      .map(([name, amount]) => ({ name, amount, estValue: +(amount * 0.01).toFixed(2) }))
      .sort((a, b) => b.amount - a.amount);

    const streamerChartData: ChartDataPoint[] = topStreamers.slice(0, 20).map((s, idx) => ({
      label: s.name,
      value: s.amount,
      secondaryValue: idx + 1,
      category: `${s.amount.toLocaleString()} Bits Cheered on ${s.name} (~$${s.estValue})`
    }));

    const timelineChartData: ChartDataPoint[] = Object.entries(dateBits)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        label: date,
        value: amount,
        category: `${amount.toLocaleString()} Bits`,
        date
      }));

    const tierChartData: ChartDataPoint[] = Object.entries(tierCounts).map(([tier, count]) => ({
      label: tier,
      value: count,
      category: `${count} Cheers`
    }));

    return {
      totalBits,
      totalEstValue: +(totalBits * 0.01).toFixed(2),
      cheerCount: records.length,
      topStreamers,
      streamerChartData,
      timelineChartData,
      tierChartData
    };
  }, [records]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.streamer.toLowerCase().includes(q) ||
          r.message.toLowerCase().includes(q) ||
          r.orderId?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, searchQuery]);

  const activeChartData =
    chartDimension === 'streamers'
      ? analytics.streamerChartData
      : chartDimension === 'timeline'
      ? analytics.timelineChartData
      : analytics.tierChartData;

  const activeChartTitle =
    chartDimension === 'streamers'
      ? 'Bits Cheered by Streamer Channel (Top Recipients)'
      : chartDimension === 'timeline'
      ? 'Bits Cheered Over Time (Daily Cheer Volume)'
      : 'Cheer Size & Bit Tier Distribution';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Bits Cheered
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {analytics.totalBits.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            ~{formatCurrency(analytics.totalEstValue)} USD value
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Cheers
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {analytics.cheerCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Cheer transactions</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer Supported
          </p>
          <div className="text-xl font-mono font-bold text-[#bf94ff] mt-1 truncate flex items-center gap-1.5" title={analytics.topStreamers[0]?.name}>
            {analytics.topStreamers[0]?.name && (
              <StreamerAvatar channelName={analytics.topStreamers[0].name} className="w-5 h-5 rounded-md inline-block shrink-0" />
            )}
            <span className="truncate">{analytics.topStreamers[0]?.name || 'N/A'}</span>
          </div>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.topStreamers[0]?.amount?.toLocaleString() || 0} bits cheered
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Streamers Supported
          </p>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {analytics.topStreamers.length}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Unique channels</p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono w-fit">
          <button
            onClick={() => setChartDimension('streamers')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'streamers'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Streamers (3D Bits)
          </button>
          <button
            onClick={() => setChartDimension('timeline')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'timeline'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cheer Timeline
          </button>
          <button
            onClick={() => setChartDimension('tiers')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'tiers'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cheer Size Tiers
          </button>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Bits"
          metricLabel="Bits"
          defaultStyle={defaultChartStyle}
          height={320}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search Bar */}
      <div className="stagger-card bg-[#18181B] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by streamer, cheer message, or order ID..."
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
          Showing <span className="text-white font-bold">{filteredRecords.length}</span> cheer events
        </div>
      </div>

      {/* Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Channel</th>
                <th className="border-b border-white/10 p-3 font-semibold">Bits Amount</th>
                <th className="border-b border-white/10 p-3 font-semibold">Est. Value</th>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp</th>
                <th className="border-b border-white/10 p-3 font-semibold">Cheer Message / Memo</th>
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
                    <td className="p-3 text-amber-400 font-bold whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300">
                        {row.bits.toLocaleString()} bits
                      </span>
                    </td>
                    <td className="p-3 text-emerald-400 whitespace-nowrap">
                      ${row.estValue}
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {formatTwitchDate(row.date)}
                    </td>
                    <td className="p-3 text-gray-300 font-sans break-words max-w-md">
                      {row.message || <span className="text-gray-600 italic">No memo</span>}
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
                  <a
                    href={selectedRecord.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#bf94ff] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>twitch.tv/{selectedRecord.streamer.toLowerCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
                    Bits Amount
                  </span>
                  <span className="text-base font-bold text-amber-400">
                    {selectedRecord.bits.toLocaleString()} Bits
                  </span>
                </div>
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Est. Value
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    ${selectedRecord.estValue} USD
                  </span>
                </div>
              </div>

              {selectedRecord.message && (
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Cheer Memo
                  </span>
                  <span className="text-xs text-white font-sans">{selectedRecord.message}</span>
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
