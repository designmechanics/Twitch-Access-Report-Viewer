import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileCode,
  FileText,
  Download,
  LayoutDashboard,
  Table,
  Code2,
  FolderOpen
} from 'lucide-react';
import { ZipFileEntry, ViewMode, ParsedCsvData, ParsedJsonData, TwitchReportStats, SectionChartSettings } from '../types';
import { formatBytes } from '../utils/twitchCategories';
import { parseCsvContent, parseJsonContent } from '../utils/fileInterpreter';

import { ChatReportView } from './ChatReportView';
import { WatchTimeReportView } from './WatchTimeReportView';
import { SubscriptionsReportView } from './SubscriptionsReportView';
import { BitsReportView } from './BitsReportView';
import { LoginHistoryReportView } from './LoginHistoryReportView';
import { ChannelPointsReportView } from './ChannelPointsReportView';
import { UserDetailsReportView } from './UserDetailsReportView';
import { GenericCsvReportView } from './GenericCsvReportView';
import { JsonTreeViewer } from './JsonTreeViewer';
import { RawTextViewer } from './RawTextViewer';

import { ArchiveOverviewView } from './ArchiveOverviewView';
import { EmptyDatasetView } from './EmptyDatasetView';

interface ReportViewerProps {
  selectedFile: ZipFileEntry | null;
  archiveName?: string | null;
  stats?: TwitchReportStats | null;
  entries?: ZipFileEntry[];
  onSelectFile?: (file: ZipFileEntry) => void;
  isOverviewSelected?: boolean;
  onSelectOverview?: () => void;
  chartSettings?: SectionChartSettings;
  userProfile?: { username: string; displayName: string } | null;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  selectedFile,
  archiveName,
  stats,
  entries = [],
  onSelectFile,
  isOverviewSelected = false,
  onSelectOverview,
  userProfile,
  chartSettings = {
    chat: '3d',
    watchTime: 'line',
    subscriptions: 'bar',
    bits: '3d',
    security: 'scatter',
    channelPoints: '3d',
    userDetails: '3d',
    generic: 'bar',
    animateReveal: true,
    colorTheme: 'twitch',
    auditSampleSize: 15,
    auditShowAll: false,
    privacyScrub: false
  }
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('report');
  const [rawText, setRawText] = useState<string>('');
  const [parsedCsv, setParsedCsv] = useState<ParsedCsvData | null>(null);
  const [parsedJson, setParsedJson] = useState<ParsedJsonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile || !selectedFile.blob) {
      setRawText('');
      setParsedCsv(null);
      setParsedJson(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setViewMode('report');

    const reader = new FileReader();

    reader.onload = () => {
      if (!isMounted) return;
      try {
        const text = (reader.result as string) || '';
        setRawText(text);

        const ext = selectedFile.extension.toLowerCase();

        if (ext === 'csv') {
          const csvData = parseCsvContent(text);
          setParsedCsv(csvData);
          setParsedJson(null);
        } else if (ext === 'json') {
          const jsonData = parseJsonContent(text);
          setParsedJson(jsonData);
          setParsedCsv(null);
        } else {
          setParsedCsv(null);
          setParsedJson(null);
          setViewMode('raw');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to interpret file content.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    reader.onerror = () => {
      if (isMounted) {
        setError('Error reading file data.');
        setLoading(false);
      }
    };

    reader.readAsText(selectedFile.blob);

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const handleDownloadFile = () => {
    if (!selectedFile || !selectedFile.blob) return;
    const url = URL.createObjectURL(selectedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If Archive Overview is active or no file selected but we have stats
  if ((isOverviewSelected || !selectedFile) && stats && entries.length > 0 && onSelectFile) {
    return (
      <section className="flex flex-1 flex-col overflow-y-auto bg-[#0F0E11] p-6 scrollbar-thin scrollbar-thumb-white/10">
        <ArchiveOverviewView
          stats={stats}
          entries={entries}
          archiveName={archiveName || null}
          onSelectFile={onSelectFile}
          userProfile={userProfile}
        />
      </section>
    );
  }

  if (!selectedFile) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-[#0F0E11]">
        <div className="w-16 h-16 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-center mb-4 text-gray-500">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-gray-300 mb-1">
          No dataset selected
        </h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Select any CSV or JSON record from the left file explorer to inspect the interpreted report.
        </p>
      </section>
    );
  }

  const ext = selectedFile.extension.toLowerCase();
  const lowerPath = selectedFile.path.toLowerCase();
  const pathParts = selectedFile.path.split('/');

  const renderInteractiveReport = () => {
    if (ext === 'csv' && parsedCsv) {
      if (parsedCsv.rowCount === 0) {
        return (
          <EmptyDatasetView
            file={selectedFile}
            headers={parsedCsv.headers}
            onViewRaw={() => setViewMode('raw')}
            onBackToOverview={onSelectOverview}
          />
        );
      }

      if (lowerPath.includes('chat') || lowerPath.includes('message')) {
        return (
          <ChatReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.chat}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
          />
        );
      }
      if (lowerPath.includes('watch') || lowerPath.includes('video') || lowerPath.includes('playback') || lowerPath.includes('stream')) {
        return (
          <WatchTimeReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.watchTime}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
            auditSampleSize={chartSettings.auditSampleSize}
            auditShowAll={chartSettings.auditShowAll}
          />
        );
      }
      if (lowerPath.includes('sub')) {
        return (
          <SubscriptionsReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.subscriptions}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
          />
        );
      }
      if (lowerPath.includes('bit') || lowerPath.includes('cheer')) {
        return (
          <BitsReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.bits}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
          />
        );
      }
      if (lowerPath.includes('login') || lowerPath.includes('session') || lowerPath.includes('security') || lowerPath.includes('ip')) {
        return (
          <LoginHistoryReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.security}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
            privacyScrub={chartSettings.privacyScrub}
          />
        );
      }
      if (lowerPath.includes('point') || lowerPath.includes('reward') || lowerPath.includes('prediction')) {
        return (
          <ChannelPointsReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.channelPoints}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
          />
        );
      }
      return (
        <GenericCsvReportView
          data={parsedCsv}
          fileName={selectedFile.name}
          defaultChartStyle={chartSettings.generic}
          animateReveal={chartSettings.animateReveal}
          colorTheme={chartSettings.colorTheme}
        />
      );
    }

    if (ext === 'json' && parsedJson) {
      if (parsedJson.itemCount === 0) {
        return (
          <EmptyDatasetView
            file={selectedFile}
            headers={[]}
            onViewRaw={() => setViewMode('raw')}
            onBackToOverview={onSelectOverview}
          />
        );
      }
      if (lowerPath.includes('user') || lowerPath.includes('account') || lowerPath.includes('profile')) {
        return (
          <UserDetailsReportView
            data={parsedJson}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.userDetails}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
            privacyScrub={chartSettings.privacyScrub}
          />
        );
      }
      return <JsonTreeViewer data={parsedJson} rawText={rawText} />;
    }

    return <RawTextViewer content={rawText} fileName={selectedFile.name} />;
  };

  return (
    <section className="flex flex-1 flex-col overflow-hidden bg-[#0F0E11]">
      {/* Breadcrumb Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#18181B]/50 px-6 py-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <span>{archiveName || 'twitch_data.zip'}</span>
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <span className="text-gray-600">/</span>
              <span className={idx === pathParts.length - 1 ? 'text-white font-medium font-sans' : ''}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 font-mono">
            {formatBytes(selectedFile.size)} &bull;{' '}
            {parsedCsv ? `${parsedCsv.rowCount.toLocaleString()} rows` : parsedJson ? `${parsedJson.itemCount} entries` : 'Raw text'}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-md border border-white/10">
            <button
              onClick={() => setViewMode('report')}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'report'
                  ? 'bg-[#9146FF] text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Report</span>
            </button>

            {ext === 'csv' && (
              <button
                onClick={() => setViewMode('table')}
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#9146FF] text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Data Grid</span>
              </button>
            )}

            <button
              onClick={() => setViewMode('raw')}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'raw'
                  ? 'bg-[#9146FF] text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Raw</span>
            </button>
          </div>

          <button
            onClick={handleDownloadFile}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
            title="Download file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-[#18181B] p-12 text-center text-xs text-gray-400">
            <div className="w-8 h-8 border-2 border-[#9146FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Interpreting {selectedFile.name}...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 text-rose-300 text-xs">
            <h4 className="font-bold text-sm mb-1">Failed to parse file</h4>
            <p>{error}</p>
          </div>
        ) : viewMode === 'report' ? (
          renderInteractiveReport()
        ) : viewMode === 'table' && parsedCsv ? (
          <GenericCsvReportView
            data={parsedCsv}
            fileName={selectedFile.name}
            defaultChartStyle={chartSettings.generic}
            animateReveal={chartSettings.animateReveal}
            colorTheme={chartSettings.colorTheme}
          />
        ) : (
          <RawTextViewer content={rawText} fileName={selectedFile.name} />
        )}
      </div>
    </section>
  );
};
