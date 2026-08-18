import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface ChannelPointsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const ChannelPointsReportView: React.FC<ChannelPointsReportViewProps> = ({ data }) => {
  const stats = useMemo(() => {
    let totalSpent = 0;
    let fulfilledCount = 0;

    for (const r of data.rows) {
      const pts = Number(r.points_spent || r.points || r.amount || 0);
      totalSpent += isNaN(pts) ? 0 : pts;

      const status = String(r.status || '').toLowerCase();
      if (status.includes('fulfill') || status.includes('success') || status.includes('complete')) {
        fulfilledCount++;
      }
    }

    return {
      totalRedemptions: data.rows.length,
      totalSpent,
      fulfilledCount
    };
  }, [data.rows]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Points Spent
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1">
            {stats.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Rewards Claimed
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.totalRedemptions}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Fulfilled
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {stats.fulfilledCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
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
