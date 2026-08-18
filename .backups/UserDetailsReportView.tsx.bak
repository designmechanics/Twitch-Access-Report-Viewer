import React from 'react';
import { Shield, Mail, Phone, Calendar, Key, Award, ExternalLink } from 'lucide-react';
import { ParsedJsonData } from '../types';

interface UserDetailsReportViewProps {
  data: ParsedJsonData;
  fileName: string;
}

export const UserDetailsReportView: React.FC<UserDetailsReportViewProps> = ({ data }) => {
  const user = data.data || {};

  const username = user.username || user.display_name || user.login || 'Twitch User';
  const displayName = user.display_name || user.username || username;
  const email = user.email || 'N/A';
  const phone = user.phone_number || user.phone || 'N/A';
  const partnerStatus = user.partner_status || user.broadcaster_type || 'Standard Broadcaster';
  const is2FA = user.two_factor_auth_enabled === true;
  const createdAt = user.created_at || user.registration_date;
  const bio = user.bio || user.description || '';
  const channelUrl = user.channel_url || (username ? `https://twitch.tv/${username}` : '');

  return (
    <div className="space-y-4">
      {/* Profile Header Banner */}
      <div className="rounded-xl border border-white/10 bg-[#18181B] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-[#9146FF] flex items-center justify-center text-white text-xl font-bold font-mono shadow-sm shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {displayName}
              </h2>
              {username && displayName.toLowerCase() !== username.toLowerCase() && (
                <span className="text-xs text-gray-400 font-mono">(@{username})</span>
              )}
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#9146FF]/10 text-[#bf94ff] border border-[#9146FF]/30">
                {partnerStatus}
              </span>
            </div>

            {bio && (
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                {bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
              {createdAt && (
                <span>Joined {new Date(createdAt).toLocaleDateString()}</span>
              )}
              {channelUrl && (
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#9146FF] hover:underline flex items-center gap-1 font-sans"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Twitch Channel</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security & Verification Card */}
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Identity & Authentication
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">Email:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{email}</span>
                {user.email_verified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">Phone:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{phone}</span>
                {user.phone_verified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10">
              <span className="text-gray-400">2FA Protected:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  is2FA
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {is2FA ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences & Privacy Card */}
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Profile Settings
          </p>

          <div className="space-y-1.5 text-xs font-mono max-h-56 overflow-y-auto pr-1">
            {Object.entries(user).map(([key, val]) => {
              if (
                ['username', 'display_name', 'email', 'phone_number', 'bio', 'channel_url', 'created_at'].includes(
                  key
                )
              ) {
                return null;
              }

              const displayVal =
                typeof val === 'object' && val !== null
                  ? JSON.stringify(val)
                  : String(val);

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded bg-white/5 text-xs"
                >
                  <span className="text-gray-400 truncate max-w-[140px]">{key}:</span>
                  <span className="text-gray-200 text-right truncate max-w-[180px]">
                    {displayVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
