import React from 'react';
import { Upload, Sparkles, RefreshCw, PanelLeftClose, PanelLeft, SlidersHorizontal } from 'lucide-react';
import { TwitchReportStats } from '../types';
import { formatBytes } from '../utils/twitchCategories';

interface HeaderProps {
  stats: TwitchReportStats | null;
  currentFileName: string | null;
  archiveName?: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isLoading: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  currentFileName,
  archiveName,
  onFileUpload,
  onReset,
  isLoading,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenSettings
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#9146FF]/25 bg-gradient-to-r from-[#1c0d30] via-[#121118] to-[#200e36] px-5 sticky top-0 z-30 shrink-0 shadow-lg shadow-black/40">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {stats && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title={isSidebarOpen ? 'Collapse File Explorer' : 'Expand File Explorer'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-[#bf94ff]" /> : <PanelLeft className="w-4 h-4 text-gray-400" />}
          </button>
        )}

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9146FF] to-[#601cc9] shadow-md shadow-[#9146FF]/30">
          <svg className="h-4.5 w-4.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Twitch Access Report
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/40">
              v2.5 PRO
            </span>
          </h1>
        </div>
      </div>

      {/* Center archive details if loaded */}
      {stats && (
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3.5 py-1.5 text-xs font-medium border border-white/10 backdrop-blur-sm">
            <span className="text-gray-400">Archive:</span>
            <span className="text-[#bf94ff] font-mono font-semibold truncate max-w-[200px]">{archiveName || 'twitch_data_request.zip'}</span>
            <span className="text-gray-500">({formatBytes(stats.totalSize)})</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 text-[11px]">
              {stats.populatedFilesCount}/{stats.totalFiles} tables active
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-mono transition-colors"
            title="Configure 3D and chart display settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#bf94ff]" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        )}

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
          className="cursor-pointer flex items-center gap-2 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#9146FF]/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{stats ? 'Upload New' : 'Upload Zip'}</span>
        </button>

        {stats && (
          <button
            onClick={onReset}
            className="cursor-pointer p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg border border-white/10 transition-colors"
            title="Clear archive"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
