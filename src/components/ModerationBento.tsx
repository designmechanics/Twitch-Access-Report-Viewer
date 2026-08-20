import React, { useMemo } from 'react';
import { ZipFileEntry } from '../types';
import { ShieldAlert, AlertTriangle, XCircle, Clock, ShieldBan } from 'lucide-react';

interface ModerationBentoProps {
  entries: ZipFileEntry[];
}

export const ModerationBento: React.FC<ModerationBentoProps> = ({ entries }) => {

  const modStats = useMemo(() => {
    let totalTimeouts = 0;
    let totalBans = 0;
    let totalDeleted = 0;
    
    // Look for moderation or ban history files
    const modEntry = entries.find(e => 
      e.path.toLowerCase().includes('moderation') || 
      e.path.toLowerCase().includes('ban') || 
      e.path.toLowerCase().includes('timeout')
    );
    
    if (modEntry && modEntry.parsedData && modEntry.parsedData.type === 'csv') {
      for (const row of modEntry.parsedData.rows) {
        const action = String(row.action || row.type || row.event || '').toLowerCase();
        if (action.includes('timeout')) totalTimeouts++;
        else if (action.includes('ban')) totalBans++;
        else if (action.includes('delete') || action.includes('purge')) totalDeleted++;
      }
    }

    return {
      totalTimeouts,
      totalBans,
      totalDeleted,
      hasData: !!modEntry
    };
  }, [entries]);

  if (!modStats.hasData || (modStats.totalTimeouts === 0 && modStats.totalBans === 0 && modStats.totalDeleted === 0)) {
    return null; // Not enough data
  }

  return (
    <div className="rounded-xl border border-rose-500/30 bg-[#121214] overflow-hidden mb-6 relative mt-6">
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/3" />
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-gradient-to-r from-rose-950/20 to-transparent">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Moderation & Penalty Record</h2>
        </div>
      </div>

      <div className="p-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Timeouts Received</div>
            <div className="text-2xl font-bold text-white">{modStats.totalTimeouts.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldBan className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Channel Bans</div>
            <div className="text-2xl font-bold text-white">{modStats.totalBans.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Deleted Messages</div>
            <div className="text-2xl font-bold text-white">{modStats.totalDeleted.toLocaleString()}</div>
          </div>
        </div>

      </div>
    </div>
  );
};
