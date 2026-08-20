import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Layers,
  Sparkles,
  Sliders,
  ExternalLink,
  X,
  FileSpreadsheet
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';
import {
  extractStreamerName,
  formatTwitchDate,
  formatCurrency,
  getStreamerAvatarColor
} from '../utils/channelHelpers';
import { StreamerAvatar } from './StreamerAvatar';

interface GenericCsvReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

export const GenericCsvReportView: React.FC<GenericCsvReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'bar',
  animateReveal = true,
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);

  // Dynamic Chart Controls
  const [showChart, setShowChart] = useState(true);
  const [selectedLabelCol, setSelectedLabelCol] = useState<string>('');
  const [selectedValueCol, setSelectedValueCol] = useState<string>('count');

  // GSAP animation
  useEffect(() => {
    if (!animateReveal || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.stagger-card', {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [animateReveal, fileName]);

  // Identify numeric, categorical, streamer, and date columns
  const columnAnalysis = useMemo(() => {
    const numericCols: string[] = [];
    const categoricalCols: string[] = [];
    const dateCols: string[] = [];
    const streamerCols: string[] = [];

    const streamerKeywords = [
      'channel',
      'streamer',
      'broadcaster',
      'recipient',
      'user_name',
      'target_user',
      'target_channel',
      'gifter',
      'to_user',
      'from_user'
    ];

    for (const h of data.headers) {
      let isNumeric = true;
      let hasNumbers = false;
      let isDate = true;
      let sampleCount = 0;

      const lowerH = h.toLowerCase();
      if (streamerKeywords.some((k) => lowerH.includes(k)) && !lowerH.includes('id') && !lowerH.includes('count')) {
        streamerCols.push(h);
      }

      for (const row of data.rows.slice(0, 50)) {
        const val = row[h];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          sampleCount++;
          if (typeof val === 'number' || (!isNaN(Number(val)) && !isNaN(parseFloat(String(val))))) {
            hasNumbers = true;
          } else {
            isNumeric = false;
          }

          if (isDate) {
            const parsed = Date.parse(String(val));
            if (isNaN(parsed) || !String(val).match(/[-/T:]/)) {
              isDate = false;
            }
          }
        }
      }

      if (hasNumbers && isNumeric) {
        numericCols.push(h);
      } else if (isDate && sampleCount > 0) {
        dateCols.push(h);
      } else {
        categoricalCols.push(h);
      }
    }

    return { numericCols, categoricalCols, dateCols, streamerCols };
  }, [data.headers, data.rows]);

  // Set default columns on data change
  useEffect(() => {
    if (data.headers.length > 0) {
      const bestLabelCol =
        columnAnalysis.streamerCols[0] ||
        columnAnalysis.dateCols[0] ||
        columnAnalysis.categoricalCols.find((c) =>
          ['channel', 'channel_name', 'username', 'category', 'type', 'name', 'title'].some((kw) =>
            c.toLowerCase().includes(kw)
          )
        ) ||
        columnAnalysis.categoricalCols[0] ||
        data.headers[0];
      setSelectedLabelCol(bestLabelCol);

      const bestValueCol =
        columnAnalysis.numericCols.find((c) =>
          ['minutes', 'amount', 'bits', 'count', 'points', 'total', 'tenure', 'price', 'cost'].some((kw) =>
            c.toLowerCase().includes(kw)
          )
        ) ||
        columnAnalysis.numericCols[0] ||
        'count';
      setSelectedValueCol(bestValueCol);
    }
  }, [data.headers, columnAnalysis]);

  // Dynamic Chart Points Generation
  const dynamicChartData = useMemo(() => {
    if (!selectedLabelCol) return [];

    const aggregation: Record<string, { total: number; count: number }> = {};

    for (const row of data.rows) {
      const rawKey = row[selectedLabelCol];
      const key = rawKey ? String(rawKey).trim() : 'Unknown';

      let numVal = 1;
      if (selectedValueCol !== 'count') {
        const val = Number(row[selectedValueCol]);
        numVal = isNaN(val) ? 0 : val;
      }

      if (!aggregation[key]) {
        aggregation[key] = { total: 0, count: 0 };
      }
      aggregation[key].total += numVal;
      aggregation[key].count += 1;
    }

    const points: ChartDataPoint[] = Object.entries(aggregation)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 25)
      .map(([label, info], i) => ({
        label,
        value: Math.round(info.total * 100) / 100,
        secondaryValue: i + 1,
        category: `${label}: ${info.total.toLocaleString()} (${info.count} records)`
      }));

    return points;
  }, [data.rows, selectedLabelCol, selectedValueCol]);

  // Sorting and Filtering
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return data.rows;
    const q = searchQuery.toLowerCase();
    return data.rows.filter((row) =>
      data.headers.some((h) => {
        const val = row[h];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  }, [data.rows, data.headers, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return sortAsc ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortAsc ? -1 : 1;

      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }

      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRows, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Helper to render cell value with context-awareness
  const renderCellContent = (header: string, val: any) => {
    const lowerH = header.toLowerCase();
    const strVal = String(val ?? '');

    // Boolean
    if (typeof val === 'boolean' || strVal === 'true' || strVal === 'false') {
      const isTrue = val === true || strVal === 'true';
      return (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
            isTrue
              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
              : 'bg-white/5 text-gray-500'
          }`}
        >
          {String(val)}
        </span>
      );
    }

    // Streamer / Channel column
    const isStreamerCol =
      columnAnalysis.streamerCols.includes(header) ||
      ['channel', 'broadcaster', 'streamer', 'recipient', 'target_user'].some((k) => lowerH.includes(k));

    if (isStreamerCol && strVal && strVal !== 'null' && strVal !== 'undefined') {
      const cleanName = strVal.replace(/^#/, '');
      const avatarColor = getStreamerAvatarColor(cleanName);
      return (
        <div className="flex items-center gap-1.5">
          <StreamerAvatar channelName={cleanName} className="w-5 h-5 rounded" />
          <span className="font-bold text-white font-sans truncate">{cleanName}</span>
          <a
            href={`https://twitch.tv/${cleanName.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 hover:text-white"
            title={`Visit twitch.tv/${cleanName}`}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
    }

    // Currency / Price
    if (['price', 'cost', 'amount', 'payout', 'revenue', 'tax'].some((k) => lowerH.includes(k)) && !isNaN(Number(val))) {
      return (
        <span className="font-mono text-emerald-400 font-bold">
          {formatCurrency(Number(val))}
        </span>
      );
    }

    // Numbers
    if (typeof val === 'number' || (!isNaN(Number(val)) && !lowerH.includes('id') && !lowerH.includes('ip'))) {
      return <span className="font-mono text-white">{Number(val).toLocaleString()}</span>;
    }

    // Dates
    if (columnAnalysis.dateCols.includes(header) || ['date', 'time', 'timestamp', 'created_at'].some((k) => lowerH.includes(k))) {
      return <span className="text-gray-400">{formatTwitchDate(strVal)}</span>;
    }

    return <span>{strVal}</span>;
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* File Header Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Records
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {data.rows.length.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Rows in {fileName}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Schema Columns
          </p>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {data.headers.length}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Headers detected</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Streamer Columns
          </p>
          <p className="text-xl font-mono font-bold text-[#bf94ff] mt-1">
            {columnAnalysis.streamerCols.length}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {columnAnalysis.streamerCols.join(', ') || 'None found'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Numeric Fields
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {columnAnalysis.numericCols.length}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Aggregate dimensions</p>
        </div>
      </div>

      {/* Dynamic 3D / Bar Chart Analyzer */}
      {showChart && dynamicChartData.length > 0 && (
        <div className="stagger-card rounded-xl border border-white/10 bg-[#18181B] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9146FF]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Interactive Multi-Dimensional Visualizer
              </h3>
            </div>

            {/* Dimension Selection Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1">
                <span className="text-gray-500">Group By:</span>
                <select
                  value={selectedLabelCol}
                  onChange={(e) => setSelectedLabelCol(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  {data.headers.map((h) => (
                    <option key={h} value={h} className="bg-[#18181B] text-white">
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1">
                <span className="text-gray-500">Metric:</span>
                <select
                  value={selectedValueCol}
                  onChange={(e) => setSelectedValueCol(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="count" className="bg-[#18181B] text-white">
                    Count (Frequency)
                  </option>
                  {columnAnalysis.numericCols.map((numH) => (
                    <option key={numH} value={numH} className="bg-[#18181B] text-white">
                      Sum of {numH}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowChart(false)}
                className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 ml-2"
              >
                Hide Chart
              </button>
            </div>
          </div>

          <UnifiedSectionChart
            data={dynamicChartData}
            title={`${selectedValueCol === 'count' ? 'Record Distribution' : 'Sum of ' + selectedValueCol} by ${selectedLabelCol}`}
            yAxisLabel={selectedValueCol === 'count' ? 'Records' : selectedValueCol}
            metricLabel={selectedValueCol === 'count' ? 'Count' : selectedValueCol}
            defaultStyle={defaultChartStyle}
            height={320}
            colorTheme={colorTheme}
          />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="stagger-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#18181B] border border-white/10 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${fileName} records...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#121214] border border-white/10 focus:border-[#9146FF] focus:outline-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
          {!showChart && (
            <button
              onClick={() => setShowChart(true)}
              className="cursor-pointer text-xs font-mono text-[#bf94ff] hover:underline"
            >
              Show Visualizer
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#121214] border border-white/10 text-gray-200 rounded px-2 py-1 focus:border-[#9146FF] focus:outline-none text-xs cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="text-gray-500 text-[11px]">
            {sortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length}
          </div>
        </div>
      </div>

      {/* Styled Data Grid Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-500 w-12 text-center">
                  #
                </th>
                {data.headers.map((header) => {
                  const isSorted = sortField === header;
                  return (
                    <th
                      key={header}
                      onClick={() => handleSort(header)}
                      className="border-b border-white/10 p-3 font-semibold text-gray-300 hover:text-white cursor-pointer select-none whitespace-nowrap transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{header}</span>
                        {isSorted ? (
                          sortAsc ? (
                            <ChevronUp className="w-3 h-3 text-[#9146FF]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[#9146FF]" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-gray-600 opacity-60" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.headers.length + 2}
                    className="p-8 text-center text-gray-500 font-sans"
                  >
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => {
                  const rowNumber = (currentPage - 1) * pageSize + rIdx + 1;
                  const isEven = rIdx % 2 === 1;

                  return (
                    <tr
                      key={rIdx}
                      onClick={() => setSelectedRow(row)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer group ${
                        isEven ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3 text-center text-gray-600 text-[11px]">
                        {rowNumber}
                      </td>
                      {data.headers.map((h) => {
                        const val = row[h];
                        return (
                          <td
                            key={h}
                            className="p-3 text-gray-300 max-w-xs truncate"
                            title={String(val ?? '')}
                          >
                            {renderCellContent(h, val)}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(row);
                          }}
                          className="cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-[#9146FF] text-gray-300 hover:text-white text-[11px] font-sans"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#121214] px-4 py-2.5 text-xs text-gray-400 font-mono">
          <div>
            Page <strong className="text-white">{currentPage}</strong> of {totalPages}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="cursor-pointer p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row Inspector Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#9146FF]" />
                <h3 className="text-sm font-bold text-white">{fileName} Record Details</h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="cursor-pointer p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 font-mono text-xs text-gray-300 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-2">
                {Object.entries(selectedRow).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 bg-[#121214] border border-white/5 rounded-xl flex items-start justify-between gap-4"
                  >
                    <span className="text-[11px] text-gray-500 uppercase font-bold shrink-0">
                      {key}
                    </span>
                    <div className="text-right text-white font-sans break-words max-w-xs">
                      {renderCellContent(key, val)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Raw JSON</span>
                <pre className="p-3 bg-[#121214] border border-white/5 rounded-xl text-[11px] overflow-x-auto text-gray-300">
                  {JSON.stringify(selectedRow, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#252529] flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
