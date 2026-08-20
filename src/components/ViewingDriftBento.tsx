import React, { useMemo } from 'react';
import { ZipFileEntry } from '../types';
import { History, Calendar, TrendingUp } from 'lucide-react';
import { StreamerAvatar } from './StreamerAvatar';

interface ViewingDriftBentoProps {
  entries: ZipFileEntry[];
}

export const ViewingDriftBento: React.FC<ViewingDriftBentoProps> = ({ entries }) => {
  const driftData = useMemo(() => {
    const watchEntry = entries.find(e => e.path.toLowerCase().includes('minutes_watched.csv'));
    if (!watchEntry || !watchEntry.parsedData || watchEntry.parsedData.type !== 'csv') {
      return null;
    }

    const yearlyData: Record<string, Record<string, number>> = {};

    for (const row of watchEntry.parsedData.rows) {
      const minutes = Number(row.minutes_logged || row.minutes_watched || 0);
      const channel = String(row.channel || row.creator || '').trim();
      const dateStr = String(row.date || row.timestamp || '');

      if (minutes > 0 && channel && dateStr) {
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear().toString();
            if (!yearlyData[year]) yearlyData[year] = {};
            yearlyData[year][channel] = (yearlyData[year][channel] || 0) + minutes;
          }
        } catch {
          // Ignore invalid dates
        }
      }
    }

    const years = Object.keys(yearlyData).sort();
    if (years.length === 0) return null;

    const timeline = years.map(year => {
      const channels = yearlyData[year];
      const topStreamers = Object.entries(channels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, mins]) => ({ name, hours: (mins / 60).toFixed(1) }));

      return {
        year,
        topStreamer: topStreamers.length > 0 ? topStreamers[0] : null,
        runnerUps: topStreamers.slice(1)
      };
    }).filter(y => y.topStreamer !== null);

    return timeline;
  }, [entries]);

  if (!driftData || driftData.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-[#121214] overflow-hidden mb-6 relative mt-6">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-gradient-to-r from-indigo-950/20 to-transparent">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Viewing Drift Over Time</h2>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex flex-col space-y-8">
          <p className="text-sm text-gray-400 max-w-2xl">
            A timeline of your primary streamer fixations year-over-year. Watch as your tastes shifted across the platform.
          </p>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {driftData.map((data, idx) => (
                <div key={data.year} className="relative z-10 bg-[#18181B] rounded-2xl border border-white/10 p-5 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:border-indigo-500/30">
                  <div className="bg-indigo-500/20 text-indigo-400 text-xs font-bold font-mono px-3 py-1 rounded-full border border-indigo-500/30 mb-4 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {data.year}
                  </div>
                  
                  {data.topStreamer && (
                    <>
                      <div className="mb-3 relative">
                        <StreamerAvatar channelName={data.topStreamer.name} className="w-16 h-16 rounded-2xl shadow-xl border border-white/10" />
                        <div className="absolute -bottom-2 -right-2 bg-[#9146FF] w-6 h-6 rounded-full border-2 border-[#18181B] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          #1
                        </div>
                      </div>
                      <div className="text-white font-bold text-base truncate w-full">{data.topStreamer.name}</div>
                      <div className="text-xs text-indigo-400 font-mono mt-1">{data.topStreamer.hours} hrs</div>
                    </>
                  )}
                  
                  {data.runnerUps && data.runnerUps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 w-full text-left">
                      <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Runner Ups
                      </div>
                      {data.runnerUps.map((runnerUp, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-between mt-1.5 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <StreamerAvatar channelName={runnerUp.name} className="w-4 h-4 rounded-full" />
                            <span className="text-gray-300 truncate">{runnerUp.name}</span>
                          </div>
                          <span className="text-gray-500 font-mono">{runnerUp.hours}h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
