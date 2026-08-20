import React, { useMemo, useEffect, useRef } from 'react';
import { Shield, Mail, Phone, Calendar, Key, Award, ExternalLink, UserCheck } from 'lucide-react';
import gsap from 'gsap';
import { ParsedJsonData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';

interface UserDetailsReportViewProps {
  data: ParsedJsonData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
  privacyScrub?: boolean;
}

export const UserDetailsReportView: React.FC<UserDetailsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = '3d',
  animateReveal = true,
  colorTheme = 'twitch',
  privacyScrub = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = data.data || {};

  const rawUsername = user.username || user.display_name || user.login || 'Twitch User';
  const rawDisplayName = user.display_name || user.username || rawUsername;
  
  const username = privacyScrub ? 'hidden_user' : rawUsername;
  const displayName = privacyScrub ? 'Anonymous_User' : rawDisplayName;
  const email = privacyScrub ? (user.email ? '******@***.com' : 'N/A') : (user.email || 'N/A');
  const phone = privacyScrub ? (user.phone_number || user.phone ? '+** *** *** ****' : 'N/A') : (user.phone_number || user.phone || 'N/A');
  const partnerStatus = user.partner_status || user.broadcaster_type || 'Standard Broadcaster';
  const is2FA = user.two_factor_auth_enabled === true;
  const createdAt = user.created_at || user.registration_date;
  const bio = privacyScrub ? (user.bio || user.description ? '[Bio hidden for privacy]' : '') : (user.bio || user.description || '');
  const channelUrl = privacyScrub ? '' : (user.channel_url || (rawUsername ? `https://twitch.tv/${rawUsername}` : ''));
  const profileImageUrl = privacyScrub ? null : (user.profile_image_url || user.logo || null);

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

  const profileChartData: ChartDataPoint[] = useMemo(() => {
    const isEmailVerified = user.email_verified ? 100 : 0;
    const isPhoneVerified = user.phone_verified ? 100 : 0;
    const is2faActive = is2FA ? 100 : 0;
    const isAffiliateOrPartner = partnerStatus.toLowerCase().includes('partner')
      ? 100
      : partnerStatus.toLowerCase().includes('affiliate')
      ? 75
      : 30;

    let accountAgeYears = 1;
    if (createdAt) {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      accountAgeYears = Math.max(0.5, Math.round((ageMs / (1000 * 60 * 60 * 24 * 365)) * 10) / 10);
    }

    return [
      { label: 'Security (2FA)', value: is2faActive, category: is2FA ? '2FA Enabled (100%)' : '2FA Disabled (0%)' },
      { label: 'Email Verified', value: isEmailVerified, category: isEmailVerified ? 'Verified (100%)' : 'Unverified (0%)' },
      { label: 'Phone Verified', value: isPhoneVerified, category: isPhoneVerified ? 'Verified (100%)' : 'Unverified (0%)' },
      { label: 'Account Tier', value: isAffiliateOrPartner, category: `${partnerStatus} status` },
      { label: 'Account Age (Yrs)', value: Math.min(100, Math.round(accountAgeYears * 15)), secondaryValue: accountAgeYears, category: `${accountAgeYears} Years Active` }
    ];
  }, [user, is2FA, partnerStatus, createdAt]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Profile Header Banner */}
      <div className="stagger-card rounded-xl border border-white/10 bg-[#18181B] p-5 relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#9146FF]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Dual Graphic: User Headshot Avatar with twitch overlay */}
            <div className="relative shrink-0">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#9146FF] shadow-lg shadow-[#9146FF]/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9146FF] via-[#772ce8] to-[#451093] flex items-center justify-center text-white text-2xl font-bold font-mono shadow-lg shadow-[#9146FF]/20 border-2 border-[#9146FF]/50">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Twitch Mini Glitch Badge in corner */}
              <div
                className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-[#9146FF] text-white border-2 border-[#18181B] shadow-md"
                title="Verified Twitch Access Report Entity"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {displayName}
                </h2>
                {username && displayName.toLowerCase() !== username.toLowerCase() && (
                  <span className="text-xs text-gray-400 font-mono">(@{username})</span>
                )}
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#9146FF]/15 text-[#bf94ff] border border-[#9146FF]/40">
                  {partnerStatus}
                </span>
                {is2FA && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>2FA Protected</span>
                  </span>
                )}
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

          {/* Twitch Official Branding Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-md bg-[#9146FF] flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase text-gray-400">Authenticated Platform</span>
              <span className="text-xs font-bold text-white font-mono">Twitch.tv GDPR/CCPA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D / Graphic Visualization */}
      <div className="stagger-card">
        <UnifiedSectionChart
          data={profileChartData}
          title="Account Verification & Standing Metrics (3D Overview)"
          yAxisLabel="Score (%)"
          metricLabel="Score"
          defaultStyle={defaultChartStyle}
          height={300}
          colorTheme={colorTheme}
        />
      </div>

      {/* Grid */}
      <div className="stagger-card grid grid-cols-1 md:grid-cols-2 gap-4">
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
