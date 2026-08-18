import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ParsedCsvData } from '../types';

interface LoginHistoryReportViewProps {
  data: ParsedCsvData;
  fileName: string;
}

export const LoginHistoryReportView: React.FC<LoginHistoryReportViewProps> = ({ data }) => {
  const stats = useMemo(() => {
    const locations = new Set<string>();
    const ips = new Set<string>();
    let twoFaSuccessCount = 0;

    for (const r of data.rows) {
      const city = r.city || '';
      const country = r.country || '';
      if (city || country) {
        locations.add(`${city ? city + ', ' : ''}${country}`);
      }
      const ip = r.ip_address || r.ip;
      if (ip) ips.add(String(ip));

      if (r.two_factor_verified === true || String(r.two_factor_verified).toLowerCase() === 'true') {
        twoFaSuccessCount++;
      }
    }

    return {
      totalLogins: data.rows.length,
      uniqueLocations: locations.size,
      uniqueIps: ips.size,
      twoFaSuccessCount
    };
  }, [data.rows]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Recorded Logins
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.totalLogins}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Distinct IPs
          </p>
          <p className="text-2xl font-mono font-bold text-white mt-1">
            {stats.uniqueIps}
          </p>
        </div>

        <div className="flex-1 min-w-[160px] rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            2FA Validated
          </p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {stats.twoFaSuccessCount}
          </p>
        </div>
      </div>

      {/* Login Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
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
