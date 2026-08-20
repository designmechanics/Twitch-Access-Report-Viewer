import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ShieldCheck, MapPin, Smartphone, Sparkles, Globe } from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface LoginHistoryReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
}

export const LoginHistoryReportView: React.FC<LoginHistoryReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'scatter',
  animateReveal = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<'timeline' | 'locations' | 'devices'>('timeline');

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

  const stats = useMemo(() => {
    const locations = new Set<string>();
    const ips = new Set<string>();
    let twoFaSuccessCount = 0;

    const dateCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};

    for (const r of data.rows) {
      const city = r.city || '';
      const country = r.country || '';
      const locStr = [city, country].filter(Boolean).join(', ') || 'Unknown Location';
      if (city || country) locations.add(locStr);
      locationCounts[locStr] = (locationCounts[locStr] || 0) + 1;

      const ip = r.ip_address || r.ip;
      if (ip) ips.add(String(ip));

      if (r.two_factor_verified === true || String(r.two_factor_verified).toLowerCase() === 'true') {
        twoFaSuccessCount++;
      }

      const client = String(r.client_type || r.device || 'Web Browser');
      deviceCounts[client] = (deviceCounts[client] || 0) + 1;

      const rawDate = String(r.login_timestamp || r.timestamp || r.date || '');
      if (rawDate) {
        try {
          const d = new Date(rawDate);
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
        category: 'Daily Authentications',
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
      totalLogins: data.rows.length,
      uniqueLocations: locations.size,
      uniqueIps: ips.size,
      twoFaSuccessCount,
      timelineChartData,
      locationChartData,
      deviceChartData
    };
  }, [data.rows]);

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
      ? 'Geographic Locations Breakdown'
      : 'Client Platforms & Devices';

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4 stagger-card">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Recorded Logins
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.totalLogins}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Authentication sessions</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Distinct IPs
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.uniqueIps}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Network origins</p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            2FA Validated
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {stats.twoFaSuccessCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {stats.totalLogins > 0 ? Math.round((stats.twoFaSuccessCount / stats.totalLogins) * 100) : 0}% secured
          </p>
        </div>
      </div>

      {/* 3D / Bar / Scatter / Trendline Chart */}
      <div className="stagger-card space-y-2">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs font-mono w-fit">
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
        />
      </div>

      {/* Login Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Timestamp
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  IP Address
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Location
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  Client / Device
                </th>
                <th className="border-b border-white/10 p-3 font-semibold text-gray-300">
                  2FA Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {data.rows.map((row, idx) => {
                const timestamp = String(row.login_timestamp || row.timestamp || row.date || '');
                const ip = String(row.ip_address || row.ip || 'Unknown IP');
                const city = row.city ? String(row.city) : '';
                const country = row.country ? String(row.country) : '';
                const clientType = String(row.client_type || row.device || 'Web Browser');
                const is2FA = row.two_factor_verified === true || String(row.two_factor_verified).toLowerCase() === 'true';
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-white/5 transition-colors ${
                      isEven ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {timestamp ? new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19) : '-'}
                    </td>
                    <td className="p-3 text-white font-bold whitespace-nowrap">
                      {ip}
                    </td>
                    <td className="p-3 text-gray-300 font-sans whitespace-nowrap">
                      {[city, country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="p-3 text-gray-400 font-sans whitespace-nowrap">
                      {clientType}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {is2FA ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 text-[11px]">
                          2FA Verified
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Standard</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
