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
  Sliders
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface GenericCsvReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const GenericCsvReportView: React.FC<GenericCsvReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'bar',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Identify numeric & categorical columns
  const columnAnalysis = useMemo(() => {
    const numericCols: string[] = [];
    const categoricalCols: string[] = [];
    const dateCols: string[] = [];

    for (const h of data.headers) {
      let isNumeric = true;
      let hasNumbers = false;
      let isDate = true;
      let sampleCount = 0;

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

    return { numericCols, categoricalCols, dateCols };
  }, [data.headers, data.rows]);

  // Set default columns on data change
  useEffect(() => {
    if (data.headers.length > 0) {
      const bestLabelCol =
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
          ['minutes', 'amount', 'bits', 'count', 'points', 'total', 'tenure'].some((kw) =>
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
        category: `${label}: ${info.total.toLocaleString()} (${info.count} rows)`
      }));

    return points;
  }, [data.rows, selectedLabelCol, selectedValueCol]);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return data.rows;
    const lowerQuery = searchQuery.toLowerCase();
    return data.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(lowerQuery)
      )
    );
  }, [data.rows, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (header: string) => {
    if (sortField === header) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(header);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  return (
    <div ref={containerRef} className="space-y-4 flex flex-col">
      {/* Metric Highlights Row */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Records
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {data.rowCount.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Rows in dataset</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Columns Mapped
          </p>
          <p className="text-2xl font-mono font-bold text-[#9146FF] mt-1">
            {data.columnCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {columnAnalysis.numericCols.length} numeric, {columnAnalysis.categoricalCols.length} text
          </p>
        </div>

        {data.summary?.dateRange ? (
          <div className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#18181B] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Timespan Span
            </p>
            <p className="text-lg font-mono font-bold text-white mt-1 truncate">
              {data.summary.dateRange.min} to {data.summary.dateRange.max}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#18181B] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Aggregates
            </p>
            <p className="text-xs font-mono text-gray-300 mt-2 truncate">
              {Object.keys(data.summary?.totalNumericFields || {}).length > 0
                ? Object.entries(data.summary!.totalNumericFields)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
                    .join(' | ')
                : 'Dataset mapped'}
            </p>
          </div>
        )}
      </div>

      {/* Dynamic 3D / Bar Correlation Graph */}
      {showChart && dynamicChartData.length > 0 && (
        <div className="stagger-card space-y-2">
          {/* Correlation Dimension Pickers */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#9146FF]" />
                <span>Correlate:</span>
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Group By (X):</span>
                <select
                  value={selectedLabelCol}
                  onChange={(e) => setSelectedLabelCol(e.target.value)}
                  className="bg-[#18181B] border border-white/10 text-gray-200 text-xs rounded px-2.5 py-1 focus:border-[#9146FF] focus:outline-none cursor-pointer"
                >
                  {data.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Metric (Y):</span>
                <select
                  value={selectedValueCol}
                  onChange={(e) => setSelectedValueCol(e.target.value)}
                  className="bg-[#18181B] border border-white/10 text-gray-200 text-xs rounded px-2.5 py-1 focus:border-[#9146FF] focus:outline-none cursor-pointer"
                >
                  <option value="count">Count (Frequency)</option>
                  {columnAnalysis.numericCols.map((numH) => (
                    <option key={numH} value={numH}>
                      Sum of {numH}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowChart(false)}
              className="cursor-pointer text-xs text-gray-500 hover:text-gray-300"
            >
              Hide Chart
            </button>
          </div>

          <UnifiedSectionChart
            data={dynamicChartData}
            title={`${selectedValueCol === 'count' ? 'Record Distribution' : 'Sum of ' + selectedValueCol} by ${selectedLabelCol}`}
            yAxisLabel={selectedValueCol === 'count' ? 'Records' : selectedValueCol}
            metricLabel={selectedValueCol === 'count' ? 'Count' : selectedValueCol}
            defaultStyle={defaultChartStyle}
            height={320}
          />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="stagger-card flex items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#18181B] border border-white/10 focus:border-[#9146FF] focus:outline-none rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          {!showChart && (
            <button
              onClick={() => setShowChart(true)}
              className="cursor-pointer text-xs font-mono text-[#9146FF] hover:underline"
            >
              Show 3D Chart
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500 font-mono">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#18181B] border border-white/10 text-gray-200 rounded px-2 py-1 focus:border-[#9146FF] focus:outline-none text-xs font-mono cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="font-mono text-gray-500 text-[11px]">
            {sortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length}
          </div>
        </div>
      </div>

      {/* Styled Table matching Professional Polish */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={data.headers.length + 1} className="p-8 text-center text-gray-500 font-sans">
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
                      className={`hover:bg-white/5 transition-colors ${
                        isEven ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3 text-center text-gray-600 text-[11px]">
                        {rowNumber}
                      </td>
                      {data.headers.map((h) => {
                        const val = row[h];
                        const isBoolean = typeof val === 'boolean';
                        const isNumber = typeof val === 'number';

                        return (
                          <td
                            key={h}
                            className="p-3 text-gray-300 max-w-xs truncate"
                            title={String(val ?? '')}
                          >
                            {isBoolean ? (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                  val
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                    : 'bg-white/5 text-gray-500'
                                }`}
                              >
                                {String(val)}
                              </span>
                            ) : isNumber ? (
                              <span className="font-mono text-white">
                                {val.toLocaleString()}
                              </span>
                            ) : (
                              <span>{String(val ?? '')}</span>
                            )}
                          </td>
                        );
                      })}
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
    </div>
  );
};
