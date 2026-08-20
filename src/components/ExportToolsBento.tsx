import React from 'react';
import { ZipFileEntry, TwitchReportStats } from '../types';
import { Download, FileJson, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ExportToolsBentoProps {
  entries: ZipFileEntry[];
  stats: TwitchReportStats;
  username: string;
  privacyScrub: boolean;
  onTogglePrivacyScrub: () => void;
}

export const ExportToolsBento: React.FC<ExportToolsBentoProps> = ({ 
  entries, 
  stats,
  username,
  privacyScrub,
  onTogglePrivacyScrub
}) => {

  const handleExportJson = () => {
    // Generate a compiled summary JSON
    const exportData = {
      exportedAt: new Date().toISOString(),
      platform: "Twitch GDPA Export Processor",
      user: privacyScrub ? "hidden_user" : username,
      summaryStats: {
        totalWatchMinutes: stats.totalWatchMinutes,
        totalChatMessages: stats.totalChatMessages,
        subscriptions: stats.totalSubscriptions,
        purchases: stats.totalPurchases,
        loginEvents: stats.totalLoginEvents,
        channelPointsRedemptions: stats.totalPointsRedemptions
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `twitch-compiled-stats-${privacyScrub ? 'scrubbed' : username.toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#18181B] overflow-hidden mb-6 relative mt-6">
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-black/20">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-300" />
          <h2 className="text-lg font-bold text-white tracking-tight">Export & Portability Tools</h2>
        </div>
      </div>

      <div className="p-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <FileJson className="w-4 h-4 text-emerald-400" />
              Compiled JSON Export
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Download a clean, structured JSON file containing all aggregated statistics, top streamers, and parsed metrics for use in other applications.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors text-xs font-bold font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .JSON</span>
          </button>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              {privacyScrub ? (
                <ShieldCheck className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              Privacy Scrub Mode
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Currently {privacyScrub ? 'Enabled' : 'Disabled'}. When enabled, all real names, email addresses, IP locations, and sensitive data are obscured on-screen and in exports.
            </p>
          </div>
          <button
            onClick={onTogglePrivacyScrub}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors text-xs font-bold font-mono border ${
              privacyScrub 
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/10'
            }`}
          >
            {privacyScrub ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>{privacyScrub ? 'Disable Privacy Scrub' : 'Enable Privacy Scrub'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
