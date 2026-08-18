import React, { useMemo } from 'react';
import { Gem } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface BitsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const BitsReportView: React.FC<BitsReportViewProps> = ({ data }) => {
  const analytics = useMemo(() => {
    let totalBits = 0;
    const streamerBits: Record<string, number> = {};

    for (const r of data.rows) {
      const bits = Number(r.bits_amount || r.amount || r.bits || 0);
      totalBits += isNaN(bits) ? 0 : bits;
      const ch = String(r.channel_name || r.streamer || r.channel || 'Streamer');
      streamerBits[ch] = (streamerBits[ch] || 0) + bits;
    }

    const topStreamers = Object.entries(streamerBits)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalBits,
      cheerCount: data.rows.length,
      topStreamers
    };
  }, [data.rows]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Bits Cheered
          </p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {analytics.totalBits.toLocaleString()}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Cheers
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {analytics.cheerCount}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer Supported
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            {analytics.topStreamers[0]?.name || 'N/A'}
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
                const channel = String(row.channel_name || row.channel || 'Streamer');
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
