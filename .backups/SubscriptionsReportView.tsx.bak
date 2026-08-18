import React, { useMemo } from 'react';
import { Gift, CheckCircle } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface SubscriptionsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const SubscriptionsReportView: React.FC<SubscriptionsReportViewProps> = ({ data }) => {
  const stats = useMemo(() => {
    let activeCount = 0;
    let giftCount = 0;
    let maxTenure = 0;
    let longestChannel = 'N/A';

    for (const r of data.rows) {
      const status = String(r.status || '').toLowerCase();
      if (status.includes('active') || status.includes('valid')) {
        activeCount++;
      }
      const isGift = r.is_gift === true || String(r.is_gift).toLowerCase() === 'true';
      if (isGift) {
        giftCount++;
      }
      const tenure = Number(r.tenure_months || r.cumulative_months || r.tenure || 0);
      if (tenure > maxTenure) {
        maxTenure = tenure;
        longestChannel = String(r.channel_name || r.channel || 'N/A');
      }
    }

    return {
      total: data.rows.length,
      activeCount,
      giftCount,
      maxTenure,
      longestChannel
    };
  }, [data.rows]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Subscriptions
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.total}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Active Subs
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {stats.activeCount}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Gift Subs Received
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1">
            {stats.giftCount}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Max Tenure
          </p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {stats.maxTenure} <span className="text-xs font-sans text-gray-500">mo</span>
          </p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Channel
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Tier
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Tenure
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Status
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Type / Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {data.rows.map((sub, idx) => {
                const channel = String(sub.channel_name || sub.channel || 'Streamer');
                const tier = String(sub.tier || 'Tier 1');
                const status = String(sub.status || 'Active');
                const tenure = sub.tenure_months || sub.cumulative_months || sub.tenure || '-';
                const isGift = sub.is_gift === true || String(sub.is_gift).toLowerCase() === 'true';
                const gifter = sub.gifted_by || sub.gifter;
                const isActive = status.toLowerCase().includes('active');
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-white/5 transition-colors ${
                      isEven ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-3 text-white font-bold font-sans">
                      {channel}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#9146FF]/10 text-[#bf94ff] border border-[#9146FF]/20 text-[11px]">
                        {tier}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">
                      {tenure} months
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isActive
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                            : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3">
                      {isGift ? (
                        <span className="text-amber-400 flex items-center gap-1 text-[11px] font-sans">
                          <Gift className="w-3 h-3" />
                          <span>Gifted {gifter ? `by ${gifter}` : ''}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 font-sans text-[11px]">Direct Subscription</span>
                      )}
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
