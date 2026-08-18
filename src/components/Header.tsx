import React from 'react';
import { Upload, Sparkles, ShieldCheck, RefreshCw, Archive, FileText } from 'lucide-react';
import { TwitchReportStats } from '../types';
import { formatBytes } from '../utils/twitchCategories';

interface HeaderProps {
  stats: TwitchReportStats | null;
  currentFileName: string | null;
  archiveName?: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentFileName,
  archiveName,
  onFileUpload,
  onReset,
  isLoading
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#18181B] px-6 sticky top-0 z-30 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#9146FF] shadow-sm">
          <svg className="h-5 w-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Twitch Access Report
            <span className="text-xs font-normal text-gray-500">v2.4.0</span>
          </h1>
        </div>
      </div>

      {/* Center archive details if loaded */}
      {stats && (
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-3.5 py-1.5 text-xs font-medium border border-white/10">
            <span className="text-gray-400">Archive:</span>
            <span className="text-[#9146FF] font-mono font-semibold">{archiveName || 'twitch_data_request.zip'}</span>
            <span className="text-gray-500">({formatBytes(stats.totalSize)})</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[11px]">
              {stats.csvCount} CSV
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[11px]">
              {stats.jsonCount} JSON
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={onFileUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="cursor-pointer flex items-center gap-2 rounded-md bg-[#9146FF] hover:bg-[#772ce8] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors active:scale-95 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{stats ? 'Upload New Archive' : 'Upload Zip'}</span>
        </button>

        {stats && (
          <button
            onClick={onReset}
            className="cursor-pointer p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md border border-white/10 transition-colors"
            title="Clear archive"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
