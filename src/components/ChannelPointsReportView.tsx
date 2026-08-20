import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface ChannelPointsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const ChannelPointsReportView: React.FC<ChannelPointsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'channels' | 'rewards'>('channels');

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

  const stats = useMemo(() => {
    let totalSpent = 0;
    let fulfilledCount = 0;
    const channelSpent: Record<string, number> = {};
    const rewardSpent: Record<string, number> = {};

    for (const r of data.rows) {
      const pts = Number(r.points_spent || r.points || r.amount || 0);
      const safePts = isNaN(pts) ? 0 : pts;
      totalSpent += safePts;

      const ch = String(r.channel_name || r.channel || 'Streamer');
      channelSpent[ch] = (channelSpent[ch] || 0) + safePts;

      const reward = String(r.reward_title || r.reward || r.title || 'Reward');
      rewardSpent[reward] = (rewardSpent[reward] || 0) + safePts;

      const status = String(r.status || '').toLowerCase();
      if (status.includes('fulfill') || status.includes('success') || status.includes('complete')) {
        fulfilledCount++;
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

    return {
      totalRedemptions: data.rows.length,
      totalSpent,
      fulfilledCount,
      channelChartData,
      rewardChartData
    };
  }, [data.rows]);

  const activeChartData = chartDimension === 'channels' ? stats.channelChartData : stats.rewardChartData;
  const activeChartTitle =
    chartDimension === 'channels'
      ? 'Points Spent by Channel (Top Channels)'
      : 'Points Spent by Custom Reward Category';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Points Spent
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1">
            {stats.totalSpent.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Channel points</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Rewards Claimed
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.totalRedemptions}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Redemptions</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Fulfilled
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {stats.fulfilledCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.totalRedemptions > 0 ? Math.round((stats.fulfilledCount / stats.totalRedemptions) * 100) : 0}% completed
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs font-mono w-fit">
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
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Points"
          metricLabel="Points"
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
                  Channel
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Reward Title
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Points Spent
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Status
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  User Prompt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {data.rows.map((row, idx) => {
                const channel = String(row.channel_name || row.channel || 'Streamer');
                const reward = String(row.reward_title || row.reward || row.title || 'Reward');
                const points = Number(row.points_spent || row.points || 0);
                const status = String(row.status || 'FULFILLED');
                const userInput = row.user_input || row.prompt || '-';
                const isFulfilled = status.toUpperCase().includes('FULFILLED') || status.toUpperCase().includes('COMPLETE');
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-white/5 transition-colors ${
                      isEven ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-3 text-white font-bold font-sans whitespace-nowrap">
                      {channel}
                    </td>
                    <td className="p-3 text-gray-200 font-sans whitespace-nowrap">
                      {reward}
                    </td>
                    <td className="p-3 text-[#9146FF] font-bold whitespace-nowrap">
                      {points.toLocaleString()} pts
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isFulfilled
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                            : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 font-sans max-w-sm truncate">
                      {userInput}
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
