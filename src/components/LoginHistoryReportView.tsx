import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  MapPin,
  Smartphone,
  Sparkles,
  Globe,
  Search,
  X,
  Lock,
  Calendar
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';
import { formatTwitchDate } from '../utils/channelHelpers';

interface LoginHistoryReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
  privacyScrub?: boolean;
}

interface LoginRecord {
  timestamp: string;
  ip: string;
  location: string;
  city: string;
  country: string;
  clientType: string;
  is2FA: boolean;
  rawRow: Record<string, any>;
}

export const LoginHistoryReportView: React.FC<LoginHistoryReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'scatter',
  animateReveal = true,
  colorTheme = 'twitch',
  privacyScrub = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'timeline' | 'locations' | 'devices'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<LoginRecord | null>(null);

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

  // Normalized records
  const records: LoginRecord[] = useMemo(() => {
    return data.rows.map((r) => {
      const timestamp = String(r.login_timestamp || r.timestamp || r.date || '');
      let ip = String(r.ip_address || r.ip || 'Unknown IP');
      let city = r.city ? String(r.city).trim() : '';
      let country = r.country ? String(r.country).trim() : '';
      
      if (privacyScrub) {
        if (ip !== 'Unknown IP') {
          ip = '***.***.***.***';
        }
        if (city) city = '[Hidden City]';
        if (country) country = '[Hidden Country]';
      }
      
      const location = [city, country].filter(Boolean).join(', ') || 'Unknown Location';
      const clientType = String(r.client_type || r.device || r.browser || 'Web Browser').trim();
      const is2FA = r.two_factor_verified === true || String(r.two_factor_verified).toLowerCase() === 'true';

      return {
        timestamp,
        ip,
        location,
        city,
        country,
        clientType,
        is2FA,
        rawRow: r
      };
    });
  }, [data.rows, privacyScrub]);

  const stats = useMemo(() => {
    const locations = new Set<string>();
    const ips = new Set<string>();
    let twoFaSuccessCount = 0;

    const dateCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};

    for (const r of records) {
      if (r.location !== 'Unknown Location') locations.add(r.location);
      locationCounts[r.location] = (locationCounts[r.location] || 0) + 1;

      if (r.ip !== 'Unknown IP') ips.add(r.ip);
      if (r.is2FA) twoFaSuccessCount++;

      deviceCounts[r.clientType] = (deviceCounts[r.clientType] || 0) + 1;

      if (r.timestamp) {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            const dateKey = d.toISOString().slice(0, 10);
            dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
          }
        } catch {
          // ignore
        }
      }
    }

    const timelineChartData: ChartDataPoint[] = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        label: date,
        value: count,
        category: `${count} Logins on ${date}`,
        date
      }));

    const locationChartData: ChartDataPoint[] = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([loc, count], idx) => ({
        label: loc,
        value: count,
        secondaryValue: idx + 1,
        category: `${count} Logins from ${loc}`
      }));

    const deviceChartData: ChartDataPoint[] = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([dev, count]) => ({
        label: dev,
        value: count,
        category: `${count} Logins on ${dev}`
      }));

    return {
      totalLogins: records.length,
      uniqueLocations: locations.size,
      uniqueIps: ips.size,
      twoFaSuccessCount,
      timelineChartData,
      locationChartData,
      deviceChartData
    };
  }, [records]);

  // Filtered
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.ip.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.clientType.toLowerCase().includes(q) ||
        r.timestamp.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const activeChartData =
    chartDimension === 'timeline'
      ? stats.timelineChartData
      : chartDimension === 'locations'
      ? stats.locationChartData
      : stats.deviceChartData;

  const activeChartTitle =
    chartDimension === 'timeline'
      ? 'Login Authentication Events Over Time'
      : chartDimension === 'locations'
      ? 'Geographic Locations Breakdown (3D)'
      : 'Client Platforms & Devices';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Recorded Logins
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {stats.totalLogins}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Authentication sessions</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Distinct IPs
          </p>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-1">
            {stats.uniqueIps}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Network origins</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Locations
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {stats.uniqueLocations}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Cities / Countries</p>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            2FA Validated
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {stats.twoFaSuccessCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.totalLogins > 0 ? Math.round((stats.twoFaSuccessCount / stats.totalLogins) * 100) : 0}% secured
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono w-fit">
          <button
            onClick={() => setChartDimension('timeline')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'timeline'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Authentication Timeline
          </button>
          <button
            onClick={() => setChartDimension('locations')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'locations'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Geographic Locations (3D)
          </button>
          <button
            onClick={() => setChartDimension('devices')}
            className={`cursor-pointer px-3 py-1 rounded transition-colors ${
              chartDimension === 'devices'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Client Devices
          </button>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel="Logins"
          metricLabel="Logins"
          defaultStyle={defaultChartStyle}
          height={320}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search Toolbar */}
      <div className="stagger-card bg-[#18181B] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP, city, country, or browser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#9146FF] focus:outline-none font-mono"
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

        <div className="text-xs font-mono text-gray-400">
          Showing <span className="text-white font-bold">{filteredRecords.length}</span> sessions
        </div>
      </div>

      {/* Login Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Timestamp</th>
                <th className="border-b border-white/10 p-3 font-semibold">IP Address</th>
                <th className="border-b border-white/10 p-3 font-semibold">Location</th>
                <th className="border-b border-white/10 p-3 font-semibold">Client / Device</th>
                <th className="border-b border-white/10 p-3 font-semibold">2FA Status</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRecords.map((row, idx) => {
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRecord(row)}
                    className={`hover:bg-white/5 transition-colors cursor-pointer group ${
                      isEven ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {formatTwitchDate(row.timestamp)}
                    </td>
                    <td className="p-3 text-white font-bold whitespace-nowrap">
                      {row.ip}
                    </td>
                    <td className="p-3 text-gray-300 font-sans whitespace-nowrap">
                      {row.location}
                    </td>
                    <td className="p-3 text-gray-400 font-sans whitespace-nowrap">
                      {row.clientType}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {row.is2FA ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 text-[11px] font-semibold">
                          2FA Verified
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                        }}
                        className="cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-[#9146FF] text-gray-300 hover:text-white text-[11px] font-sans"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Login Session Inspector</h3>
                  <p className="text-[11px] font-mono text-gray-400">{selectedRecord.ip}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="cursor-pointer p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 font-mono text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Location
                  </span>
                  <span className="text-sm font-bold text-white font-sans">
                    {selectedRecord.location}
                  </span>
                </div>
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Security
                  </span>
                  <span className={`text-sm font-bold ${selectedRecord.is2FA ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {selectedRecord.is2FA ? '2FA Protected' : 'Standard Password'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Device Client & Platform
                </span>
                <span className="text-xs text-gray-200 font-sans">{selectedRecord.clientType}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Raw Log Row</span>
                <pre className="p-3 bg-[#121214] border border-white/5 rounded-xl text-[11px] overflow-x-auto text-gray-300">
                  {JSON.stringify(selectedRecord.rawRow, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-white/10 bg-[#252529] flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
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
