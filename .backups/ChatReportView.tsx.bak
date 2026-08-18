import React, { useState, useMemo } from 'react';
import { MessageSquare, Search, Filter } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface ChatReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const ChatReportView: React.FC<ChatReportViewProps> = ({ data }) => {
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    for (const r of data.rows) {
      const ch = String(r.channel_name || r.channel || 'unknown');
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }
    const sortedChannels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
    const topChannel = sortedChannels[0] ? sortedChannels[0][0] : 'None';

    return {
      total,
      uniqueChannels: channels.length,
      topChannel,
      topChannelCount: sortedChannels[0] ? sortedChannels[0][1] : 0
    };
  }, [data.rows, channels]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Messages
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.total.toLocaleString()}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Channel
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            {stats.topChannel}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Streamers Chatted In
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.uniqueChannels}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg">
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
