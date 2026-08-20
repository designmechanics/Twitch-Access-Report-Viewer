import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileCode,
  FileText,
  Layers,
  Database,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { TwitchReportStats, ZipFileEntry } from '../types';
import { formatBytes } from '../utils/twitchCategories';
import { TwitchWrappedBento } from './TwitchWrappedBento';
import { WalletLedgerBento } from './WalletLedgerBento';
import { ModerationBento } from './ModerationBento';
import { ChannelPointsBento } from './ChannelPointsBento';
import { ViewingDriftBento } from './ViewingDriftBento';
import { ExportToolsBento } from './ExportToolsBento';

interface ArchiveOverviewViewProps {
  stats: TwitchReportStats;
  entries: ZipFileEntry[];
  archiveName: string | null;
  onSelectFile: (file: ZipFileEntry) => void;
  userProfile?: { username: string; displayName: string } | null;
  privacyScrub?: boolean;
  onTogglePrivacyScrub?: () => void;
}

export const ArchiveOverviewView: React.FC<ArchiveOverviewViewProps> = ({
  stats,
  entries,
  archiveName,
  onSelectFile,
  userProfile,
  privacyScrub = false,
  onTogglePrivacyScrub = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'populated' | 'empty'>('populated');

  const populatedEntries = useMemo(() => {
    return entries.filter((e) => e.isPopulated);
  }, [entries]);

  const emptyEntries = useMemo(() => {
    return entries.filter((e) => !e.isPopulated);
  }, [entries]);

  const sortedPopulated = useMemo(() => {
    return [...populatedEntries].sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0));
  }, [populatedEntries]);

  const displayedEntries = useMemo(() => {
    let list = entries;
    if (filterType === 'populated') list = populatedEntries;
    if (filterType === 'empty') list = emptyEntries;

    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [entries, populatedEntries, emptyEntries, filterType, searchTerm]);

  const renderIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Overview Title Banner */}
      <div className="rounded-xl border border-white/10 bg-[#18181B] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
              <Database className="w-3.5 h-3.5 text-[#9146FF]" />
              <span>Twitch Data Collection Archive Analysis</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {archiveName || 'twitch_data_export.zip'}
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Complete diagnostic scan of all unpacked data tables, schemas, and event logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500">
                Archive Payload
              </p>
              <p className="text-lg font-mono font-bold text-white">
                {formatBytes(stats.totalSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {userProfile && (
        <>
          <TwitchWrappedBento entries={entries} username={userProfile.username} />
          <ViewingDriftBento entries={entries} />
          <WalletLedgerBento entries={entries} username={userProfile.username} />
          <ModerationBento entries={entries} />
          <ChannelPointsBento entries={entries} />
          
          <ExportToolsBento 
            entries={entries} 
            stats={stats} 
            username={userProfile.username} 
            privacyScrub={privacyScrub}
            onTogglePrivacyScrub={onTogglePrivacyScrub}
          />
        </>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
              Total Files
            </span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats.totalFiles}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {stats.csvCount} CSVs &bull; {stats.jsonCount} JSONs
          </div>
        </div>

        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
              Active Data Tables
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-300">
            {stats.populatedFilesCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono mt-1">
            {stats.totalRecordsCount.toLocaleString()} total logged events
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
              Empty Schema Files
            </span>
            <AlertCircle className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-gray-300">
            {stats.emptyFilesCount}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            0 recorded rows (templates)
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
              Categories Detected
            </span>
            <TrendingUp className="w-4 h-4 text-[#9146FF]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#bf94ff]">
            {stats.categories.length}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {stats.categories.filter((c) => c.populatedCount > 0).length} categories with data
          </div>
        </div>
      </div>

      {/* Why are CSVs empty explanation card */}
      <div className="rounded-xl border border-[#9146FF]/30 bg-[#9146FF]/5 p-4 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-[#9146FF] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h3 className="font-bold text-white">
            Why are so many CSV files in the Twitch export empty?
          </h3>
          <p className="text-gray-300 leading-relaxed">
            When Twitch generates a GDPR / CCPA Data Subject Access Request (DSAR) export, their data warehouse automated pipeline exports every single database schema file (e.g. bits, polls, channel point rewards, moderator actions, whisper logs, suspensions, payout history). If your account has never used a specific feature, Twitch generates that CSV file with just the column header names and zero data rows.
          </p>
          <p className="text-[#bf94ff] font-medium pt-1">
            Use the "Active Tables with Records" list below or the sidebar filter to explore your active logs.
          </p>
        </div>
      </div>

      {/* Populated Files Quick Launcher */}
      <div className="rounded-xl border border-white/10 bg-[#18181B] overflow-hidden">
        <div className="bg-[#252529] px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Active Tables with Records ({populatedEntries.length})
            </h3>
            <p className="text-[11px] text-gray-400">
              Direct access to all files in this archive that contain historical logs and activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
              Ranked by record count
            </span>
          </div>
        </div>

        {sortedPopulated.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No populated datasets found in this archive.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            {sortedPopulated.map((entry) => (
              <div
                key={entry.path}
                onClick={() => onSelectFile(entry)}
                className="cursor-pointer group flex items-center justify-between p-3.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-[#9146FF]/50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderIcon(entry.extension)}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-[#bf94ff] truncate transition-colors">
                      {entry.name}
                    </p>
                    <p className="text-[10px] font-mono text-gray-500 truncate">
                      {entry.path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {(entry.rowCount || 0).toLocaleString()} rows
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {formatBytes(entry.size)}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#9146FF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Archive Inventory Table */}
      <div className="rounded-xl border border-white/10 bg-[#18181B] overflow-hidden">
        <div className="bg-[#252529] px-6 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Archive File Inventory
            </h3>
            <span className="text-xs font-mono text-gray-500">
              ({displayedEntries.length} items)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-[#18181B] p-0.5 rounded border border-white/10 text-xs">
              <button
                onClick={() => setFilterType('populated')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'populated'
                    ? 'bg-[#9146FF] text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Has Data ({populatedEntries.length})
              </button>
              <button
                onClick={() => setFilterType('empty')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'empty'
                    ? 'bg-[#9146FF] text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Empty ({emptyEntries.length})
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'all'
                    ? 'bg-[#9146FF] text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({entries.length})
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 focus:border-[#9146FF] focus:outline-none rounded pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#202024] shadow-sm z-10">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  File / Path
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Category
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Status &amp; Rows
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Size
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                    No files match the selected filter.
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const isEven = idx % 2 === 1;

                  return (
                    <tr
                      key={entry.path}
                      className={`hover:bg-white/5 transition-colors ${
                        isEven ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {renderIcon(entry.extension)}
                          <span className="text-white font-medium">{entry.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 pl-6 truncate max-w-md">
                          {entry.path}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 text-[11px] font-sans">
                          {entry.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {entry.isPopulated ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{(entry.rowCount || 0).toLocaleString()} rows</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5 text-[11px]">
                            <span>0 rows (schema only)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">
                        {formatBytes(entry.size)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onSelectFile(entry)}
                          className="cursor-pointer px-2.5 py-1 rounded bg-[#9146FF]/10 hover:bg-[#9146FF]/20 text-[#bf94ff] hover:text-white border border-[#9146FF]/30 text-xs font-medium transition-colors"
                        >
                          View
                        </button>
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
