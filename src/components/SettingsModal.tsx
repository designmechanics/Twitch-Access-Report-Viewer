import React from 'react';
import { X, Sliders, Box, BarChart3, Dot, TrendingUp, Sparkles, Check, RotateCcw, Palette, Zap, Layers } from 'lucide-react';
import { SectionChartSettings, ChartStyle } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SectionChartSettings;
  onUpdateSettings: (newSettings: SectionChartSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const handleSectionStyleChange = (section: keyof SectionChartSettings, style: ChartStyle) => {
    onUpdateSettings({
      ...settings,
      [section]: style
    });
  };

  const handleThemeChange = (theme: SectionChartSettings['colorTheme']) => {
    onUpdateSettings({
      ...settings,
      colorTheme: theme
    });
  };

  const handleAnimationToggle = () => {
    onUpdateSettings({
      ...settings,
      animateReveal: !settings.animateReveal
    });
  };

  const handleAuditSampleSizeChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      auditSampleSize: Math.max(10, Math.min(1000, val))
    });
  };

  const handleAuditShowAllToggle = () => {
    onUpdateSettings({
      ...settings,
      auditShowAll: !settings.auditShowAll
    });
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      chat: '3d',
      watchTime: 'line',
      subscriptions: 'bar',
      bits: '3d',
      security: 'scatter',
      channelPoints: '3d',
      userDetails: 'bar',
      generic: '3d',
      animateReveal: true,
      colorTheme: 'twitch',
      auditSampleSize: 15,
      auditShowAll: false
    });
  };

  const sections: { id: keyof SectionChartSettings; name: string; description: string }[] = [
    { id: 'watchTime', name: 'Watch Time & Streams', description: 'Minutes watched timeline and streamer telemetry' },
    { id: 'chat', name: 'Chat Messages & Channels', description: 'Message volume vs channels vs temporal activity' },
    { id: 'subscriptions', name: 'Subscriptions & Tiers', description: 'Sub tenure, tier distribution, and channel breakdowns' },
    { id: 'bits', name: 'Bits & Cheers', description: 'Cheer contributions and streamer support values' },
    { id: 'security', name: 'Security & Login History', description: 'Authentication IPs, client devices, and 2FA patterns' },
    { id: 'channelPoints', name: 'Channel Points', description: 'Reward redemption burn rates and claimed items' },
    { id: 'userDetails', name: 'User Profile & Identity', description: 'Account metadata and property structure' },
    { id: 'generic', name: 'Universal CSV Data Grid', description: 'Dynamic graphing for arbitrary Twitch data tables' }
  ];

  const styleOptions: { id: ChartStyle; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: '3d', label: '3D Graphic', icon: Box },
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'scatter', label: 'Dot Splatter', icon: Dot },
    { id: 'line', label: 'Trend Line', icon: TrendingUp }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#121214] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#180e29] to-[#18181B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 text-[#bf94ff]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Visual Analytics & Chart Preferences</h2>
              <p className="text-xs text-gray-400 font-mono">
                Configure 3D WebGL, Bar, Scatter, and Trend styles for each section
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* Global Theme & Animation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Theme Selector */}
            <div className="rounded-xl border border-white/10 bg-[#18181B] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                <Palette className="w-4 h-4 text-[#9146FF]" />
                <span>Visual Palette</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'twitch', label: 'Twitch Violet', color: 'bg-[#9146FF]' },
                  { id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-[#00f0ff]' },
                  { id: 'emerald', label: 'Emerald Mint', color: 'bg-[#10b981]' },
                  { id: 'amber', label: 'Amber Gold', color: 'bg-[#f59e0b]' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as any)}
                    className={`cursor-pointer flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      settings.colorTheme === t.id
                        ? 'border-[#9146FF] bg-[#9146FF]/15 text-white font-bold'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.color}`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GSAP Stagger Animations */}
            <div className="rounded-xl border border-white/10 bg-[#18181B] p-4 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Sequential Flow Reveals</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  GSAP powered stagger transitions when navigating between reports.
                </p>
              </div>

              <button
                onClick={handleAnimationToggle}
                className={`cursor-pointer w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                  settings.animateReveal
                    ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                <span>{settings.animateReveal ? 'Sequential Motion Enabled' : 'Static (Instant Reveal)'}</span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center ${
                    settings.animateReveal ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {settings.animateReveal && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </button>
            </div>
          </div>

          {/* Privacy Scrub Mode */}
          <div className="rounded-xl border border-white/10 bg-[#18181B] p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>Privacy Scrub Mode</span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">
                  Obscures IP addresses, real names, email addresses, and geo-coordinates across the interface for safe screenshots.
                </p>
              </div>

              <button
                onClick={() => onUpdateSettings({ ...settings, privacyScrub: !settings.privacyScrub })}
                className={`shrink-0 cursor-pointer px-4 py-2 rounded-lg border text-xs font-mono font-bold flex items-center justify-between gap-3 transition-all sm:min-w-[140px] ${
                  settings.privacyScrub
                    ? 'border-rose-500/60 bg-rose-950/40 text-rose-300'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                <span>{settings.privacyScrub ? 'Scrub Enabled' : 'Scrub Disabled'}</span>
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center ${
                    settings.privacyScrub ? 'bg-rose-500 text-black' : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {settings.privacyScrub && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </button>
            </div>
          </div>

          {/* Inspector Audit Depth Configuration */}
          <div className="rounded-xl border border-white/10 bg-[#18181B] p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#9146FF]/20 border border-[#9146FF]/40 text-[#bf94ff]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Playback Inspector Audit Depth</h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Define row sample size for the logical duration step-by-step inspector
                  </p>
                </div>
              </div>

              {/* ALL Range Toggle */}
              <button
                onClick={handleAuditShowAllToggle}
                className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  settings.auditShowAll
                    ? 'border-cyan-500/60 bg-cyan-950/50 text-cyan-300 shadow-sm'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>ALL Range (Entire Dataset)</span>
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                    settings.auditShowAll ? 'bg-cyan-400 text-black font-extrabold' : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {settings.auditShowAll && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </button>
            </div>

            {/* Slider Widget Area */}
            <div className={`space-y-3 transition-opacity ${settings.auditShowAll ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Inspector Row Limit:</span>
                <span className="font-bold text-[#bf94ff] px-2 py-0.5 rounded bg-[#9146FF]/20 border border-[#9146FF]/40">
                  {settings.auditShowAll ? 'ALL (Unlimited)' : `${settings.auditSampleSize} Rows`}
                </span>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={5}
                  value={settings.auditSampleSize}
                  disabled={settings.auditShowAll}
                  onChange={(e) => handleAuditSampleSizeChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-[#9146FF] border border-white/10"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>10 rows</span>
                  <span>250</span>
                  <span>500</span>
                  <span>750</span>
                  <span>1,000 rows</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-500 font-mono mr-1">Presets:</span>
                {[15, 25, 50, 100, 250, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    disabled={settings.auditShowAll}
                    onClick={() => handleAuditSampleSizeChange(preset)}
                    className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      !settings.auditShowAll && settings.auditSampleSize === preset
                        ? 'bg-[#9146FF] text-white font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {settings.auditShowAll && (
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>Slider disabled: Inspector will calculate and display all rows present in the active dataset.</span>
              </div>
            )}
          </div>

          {/* Per Section Chart Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                Section Default Chart Styles
              </h3>
              <button
                onClick={handleResetDefaults}
                className="cursor-pointer text-[11px] font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {sections.map((sec) => {
                const currentStyle = (settings as any)[sec.id] || '3d';

                return (
                  <div
                    key={sec.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-[#18181B] hover:border-white/20 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{sec.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{sec.description}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 self-start sm:self-auto">
                      {styleOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = currentStyle === opt.id;

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSectionStyleChange(sec.id, opt.id)}
                            title={opt.label}
                            className={`cursor-pointer flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                              isSelected
                                ? 'bg-[#9146FF] text-white font-bold shadow-sm'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="hidden md:inline">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-white/10 bg-[#18181B]">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-semibold shadow-md transition-colors"
          >
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
};
