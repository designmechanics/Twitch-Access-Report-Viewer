import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Gem, Sparkles, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface BitsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const BitsReportView: React.FC<BitsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'streamers' | 'timeline'>('streamers');

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
    let totalBits = 0;
    const streamerBits: Record<string, number> = {};
    const dateBits: Record<string, number> = {};

    for (const r of data.rows) {
      const bits = Number(r.bits_amount || r.amount || r.bits || 0);
      totalBits += isNaN(bits) ? 0 : bits;
      const ch = String(r.channel_name || r.streamer || r.channel || 'Streamer');
      streamerBits[ch] = (streamerBits[ch] || 0) + bits;

      const rawDate = String(r.timestamp || r.date || '');
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().slice(0, 10);
            dateBits[dateKey] = (dateBits[dateKey] || 0) + bits;
          }
        } catch {
          // ignore
        }
      }
    }

    const topStreamers = Object.entries(streamerBits)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const streamerChartData: ChartDataPoint[] = topStreamers.slice(0, 20).map((s, idx) => ({
      label: s.name,
      value: s.amount,
      secondaryValue: idx + 1,
      category: `${s.amount.toLocaleString()} Bits Cheered`
    }));

    const timelineChartData: ChartDataPoint[] = Object.entries(dateBits)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        label: date,
        value: amount,
        category: 'Daily Bits Cheered',
        date
      }));

    return {
      totalBits,
      cheerCount: data.rows.length,
      topStreamers,
      streamerChartData,
      timelineChartData
    };
  }, [data.rows]);

  const activeChartData = chartDimension === 'streamers' ? analytics.streamerChartData : analytics.timelineChartData;
  const activeChartTitle =
    chartDimension === 'streamers'
      ? 'Bits Cheered by Streamer (Top Recipients)'
      : 'Bits Cheered Over Time (Timeline)';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Bits Cheered
          </p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {analytics.totalBits.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Community cheers</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Cheers
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {analytics.cheerCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Transactions</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer Supported
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            {analytics.topStreamers[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
            {analytics.topStreamers[0]?.amount?.toLocaleString() || 0} bits
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs font-mono w-fit">
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
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Bits"
          metricLabel="Bits"
          defaultStyle={defaultChartStyle}
          height={320}
        />
      </div>

      {/* Table */}
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
                  Bits Amount
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Message Memo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {data.rows.map((row, idx) => {
                const channel = String(row.channel_name || row.streamer || row.channel || 'Streamer');
                const bits = Number(row.bits_amount || row.bits || 0);
                const message = String(row.cheer_message || row.message || row.memo || '');
                const timestamp = String(row.timestamp || row.date || '');
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
                    <td className="p-3 text-white font-bold font-sans whitespace-nowrap">
                      {channel}
                    </td>
                    <td className="p-3 text-amber-400 font-bold whitespace-nowrap">
                      {bits.toLocaleString()} bits
                    </td>
                    <td className="p-3 text-gray-300 font-sans break-words max-w-md">
                      {message || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
