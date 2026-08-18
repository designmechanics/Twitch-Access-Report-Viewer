import React from 'react';
import { FileSpreadsheet, Info, ArrowLeft, Code2, ShieldAlert } from 'lucide-react';
import { ZipFileEntry } from '../types';
import { formatBytes } from '../utils/twitchCategories';

interface EmptyDatasetViewProps {
  file: ZipFileEntry;
  headers?: string[];
  onViewRaw?: () => void;
  onBackToOverview?: () => void;
}

export const EmptyDatasetView: React.FC<EmptyDatasetViewProps> = ({
  file,
  headers = [],
  onViewRaw,
  onBackToOverview
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="rounded-xl border border-white/10 bg-[#18181B] p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
          <FileSpreadsheet className="w-7 h-7 text-gray-500" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Twitch Schema Template
          </span>
          <h2 className="text-xl font-bold text-white">{file.name}</h2>
          <p className="text-xs text-gray-400 font-mono">
            {file.path} &bull; {formatBytes(file.size)}
          </p>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-left flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 space-y-1">
            <p className="font-semibold text-amber-300">
              0 recorded rows for this feature on your account
            </p>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              Twitch data subject access exports contain every potential database schema table. Because your Twitch account has no recorded events or logs for this specific category, Twitch provided an empty CSV containing only the predefined column headers.
            </p>
          </div>
        </div>

        {headers && headers.length > 0 && (
          <div className="text-left space-y-2 pt-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
              Predefined Schema Columns ({headers.length}):
            </p>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-black/40 border border-white/5">
              {headers.map((h, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Archive Summary</span>
            </button>
          )}

          {onViewRaw && (
            <button
              onClick={onViewRaw}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span>Inspect Raw File</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
