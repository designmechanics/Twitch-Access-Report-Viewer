import React, { useMemo } from 'react';
import { Clock, Tv, Film, Monitor } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface WatchTimeReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const WatchTimeReportView: React.FC<WatchTimeReportViewProps> = ({ data }) => {
  const analytics = useMemo(() => {
    let totalMinutes = 0;
    const channelWatch: Record<string, number> = {};
    const categoryWatch: Record<string, number> = {};
    const deviceWatch: Record<string, number> = {};

    for (const r of data.rows) {
      const mins = Number(r.minutes_watched || r.duration_minutes || r.minutes || r.watch_time || 0);
      totalMinutes += isNaN(mins) ? 0 : mins;

      const ch = String(r.channel_name || r.streamer || r.channel || 'Unknown Streamer');
      channelWatch[ch] = (channelWatch[ch] || 0) + mins;

      const cat = String(r.category_name || r.game || r.category || 'General Broadcast');
      categoryWatch[cat] = (categoryWatch[cat] || 0) + mins;

      const dev = String(r.device_type || r.client_platform || r.device || 'Desktop / Web');
      deviceWatch[dev] = (deviceWatch[dev] || 0) + mins;
    }

    const topChannels = Object.entries(channelWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const topCategories = Object.entries(categoryWatch)
      .map(([name, mins]) => ({ name, mins, hours: +(mins / 60).toFixed(1) }))
      .sort((a, b) => b.mins - a.mins);

    const deviceBreakdown = Object.entries(deviceWatch)
      .map(([name, mins]) => ({
        name,
        mins,
        percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0
      }))
      .sort((a, b) => b.mins - a.mins);

    return {
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(1),
      topChannels,
      topCategories,
      deviceBreakdown
    };
  }, [data.rows]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Hours Watched
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {analytics.totalHours.toLocaleString()} <span className="text-xs font-normal text-gray-500 font-sans">hrs</span>
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Streamer
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1 truncate">
            {analytics.topChannels[0]?.name || 'N/A'}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Top Category
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1 truncate">
            {analytics.topCategories[0]?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Grid of rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Streamers */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Top Streamers Watched
            </h3>
            <span className="text-[10px] font-mono text-gray-500">Hours</span>
          </div>

          <div className="divide-y divide-white/5 font-mono text-xs p-2">
            {analytics.topChannels.slice(0, 8).map((item, idx) => (
              <div key={item.name} className="py-2 px-3 flex items-center justify-between hover:bg-white/5 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-4 font-bold">#{idx + 1}</span>
                  <span className="text-white font-semibold font-sans">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold">{item.hours}h</span>
                  <span className="text-gray-600 text-[10px]">({item.mins}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
          <div className="bg-[#252529] px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Top Game Categories
            </h3>
            <span className="text-[10px] font-mono text-gray-500">Hours</span>
          </div>

          <div className="divide-y divide-white/5 font-mono text-xs p-2">
            {analytics.topCategories.slice(0, 8).map((item, idx) => (
              <div key={item.name} className="py-2 px-3 flex items-center justify-between hover:bg-white/5 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-4 font-bold">#{idx + 1}</span>
                  <span className="text-white font-semibold font-sans">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-bold">{item.hours}h</span>
                  <span className="text-gray-600 text-[10px]">({item.mins}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
