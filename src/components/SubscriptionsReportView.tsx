import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Gift,
  CheckCircle,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpDown,
  X,
  CreditCard,
  UserCheck,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';
import gsap from 'gsap';
import { ParsedCsvData, ChartStyle } from '../types';
import { UnifiedSectionChart } from './charts/UnifiedSectionChart';
import { ChartDataPoint } from './charts/ThreeDVisualization';
import {
  extractNormalizedSub,
  NormalizedSubInfo,
  formatTwitchDate,
  formatCurrency,
  getStreamerAvatarColor
} from '../utils/channelHelpers';
import { StreamerAvatar } from './StreamerAvatar';

interface SubscriptionsReportViewProps {
  data: ParsedCsvData;
  fileName: string;
  defaultChartStyle?: ChartStyle;
  animateReveal?: boolean;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

export const SubscriptionsReportView: React.FC<SubscriptionsReportViewProps> = ({
  data,
  fileName,
  defaultChartStyle = 'bar',
  animateReveal = true,
  colorTheme = 'twitch'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimension, setChartDimension] = useState<
    'tenure' | 'spending' | 'tiers' | 'timeline' | 'gifting'
  >('tenure');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'active' | 'expired' | 'prime' | 'giftsReceived' | 'giftsSent' | 'tier1' | 'tier2' | 'tier3'
  >('all');
  const [selectedSub, setSelectedSub] = useState<NormalizedSubInfo | null>(null);

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

  // Normalize all rows
  const normalizedRows: NormalizedSubInfo[] = useMemo(() => {
    return data.rows.map((r) => extractNormalizedSub(r));
  }, [data.rows]);

  // Compute aggregate statistics
  const analytics = useMemo(() => {
    let activeCount = 0;
    let expiredCount = 0;
    let primeCount = 0;
    let giftsReceivedCount = 0;
    let giftsSentCount = 0;
    let totalEstSpend = 0;
    let maxTenure = 0;
    let longestChannel = 'N/A';

    const channelTenure: Record<string, number> = {};
    const channelSpend: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};

    for (const sub of normalizedRows) {
      if (sub.isActive) activeCount++;
      else expiredCount++;

      if (sub.isPrime) primeCount++;
      if (sub.isGiftReceived) giftsReceivedCount++;
      if (sub.isGiftSent) giftsSentCount += sub.giftCount;

      const cost = sub.price || 0;
      totalEstSpend += cost;

      channelTenure[sub.channel] = Math.max(channelTenure[sub.channel] || 0, sub.tenureMonths);
      channelSpend[sub.channel] = (channelSpend[sub.channel] || 0) + cost;

      tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;

      if (sub.startDate) {
        try {
          const d = new Date(sub.startDate);
          if (!isNaN(d.getTime())) {
            const monthKey = d.toISOString().slice(0, 7);
            dateCounts[monthKey] = (dateCounts[monthKey] || 0) + 1;
          }
        } catch {
          // ignore
        }
      }

      if (sub.tenureMonths > maxTenure) {
        maxTenure = sub.tenureMonths;
        longestChannel = sub.channel;
      }
    }

    // Tenure 3D Chart Data
    const sortedTenures: ChartDataPoint[] = Object.entries(channelTenure)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ch, tenure], i) => ({
        label: ch,
        value: tenure,
        secondaryValue: i + 1,
        category: `${tenure} Months Tenure with ${ch}`
      }));

    // Spend by Streamer Chart Data
    const sortedSpend: ChartDataPoint[] = Object.entries(channelSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([ch, spend], i) => ({
        label: ch,
        value: Math.round(spend * 100) / 100,
        secondaryValue: i + 1,
        category: `${formatCurrency(spend)} Spent on ${ch}`
      }));

    // Tier Breakdown Chart Data
    const tierChartData: ChartDataPoint[] = Object.entries(tierCounts).map(([tier, count]) => ({
      label: tier,
      value: count,
      category: `${count} Subscriptions in ${tier}`
    }));

    // Timeline Chart Data
    const timelineChartData: ChartDataPoint[] = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({
        label: month,
        value: count,
        category: `Subscriptions in ${month}`,
        date: month
      }));

    // Gifting Breakdown
    const giftingChartData: ChartDataPoint[] = [
      { label: 'Direct Subs', value: Math.max(0, normalizedRows.length - giftsReceivedCount), category: 'Personal Direct Subscriptions' },
      { label: 'Gifts Received', value: giftsReceivedCount, category: 'Gifted by Community Members' },
      { label: 'Gifts Sent', value: giftsSentCount, category: 'Gift Subs Given to Others' },
      { label: 'Prime Gaming', value: primeCount, category: 'Prime Free Monthly Sub' }
    ];

    return {
      total: normalizedRows.length,
      activeCount,
      expiredCount,
      primeCount,
      giftsReceivedCount,
      giftsSentCount,
      totalEstSpend,
      maxTenure,
      longestChannel,
      sortedTenures,
      sortedSpend,
      tierChartData,
      timelineChartData,
      giftingChartData
    };
  }, [normalizedRows]);

  // Filtered rows for the table
  const filteredRows = useMemo(() => {
    return normalizedRows.filter((sub) => {
      // Filter tab
      if (filterType === 'active' && !sub.isActive) return false;
      if (filterType === 'expired' && sub.isActive) return false;
      if (filterType === 'prime' && !sub.isPrime) return false;
      if (filterType === 'giftsReceived' && !sub.isGiftReceived) return false;
      if (filterType === 'giftsSent' && !sub.isGiftSent) return false;
      if (filterType === 'tier1' && !sub.tier.includes('Tier 1')) return false;
      if (filterType === 'tier2' && !sub.tier.includes('Tier 2')) return false;
      if (filterType === 'tier3' && !sub.tier.includes('Tier 3')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesChannel = sub.channel.toLowerCase().includes(q);
        const matchesTier = sub.tier.toLowerCase().includes(q);
        const matchesGifter = sub.gifterName?.toLowerCase().includes(q);
        const matchesRecipient = sub.recipientName?.toLowerCase().includes(q);
        const matchesOrderId = sub.orderId?.toLowerCase().includes(q);
        const matchesStatus = sub.status.toLowerCase().includes(q);
        return matchesChannel || matchesTier || matchesGifter || matchesRecipient || matchesOrderId || matchesStatus;
      }

      return true;
    });
  }, [normalizedRows, filterType, searchQuery]);

  // Current active chart dataset
  const activeChartData = useMemo(() => {
    switch (chartDimension) {
      case 'tenure':
        return analytics.sortedTenures;
      case 'spending':
        return analytics.sortedSpend;
      case 'tiers':
        return analytics.tierChartData;
      case 'timeline':
        return analytics.timelineChartData.length > 0 ? analytics.timelineChartData : analytics.sortedTenures;
      case 'gifting':
        return analytics.giftingChartData;
      default:
        return analytics.sortedTenures;
    }
  }, [chartDimension, analytics]);

  const activeChartTitle = useMemo(() => {
    switch (chartDimension) {
      case 'tenure':
        return 'Cumulative Subscription Tenure by Streamer Channel (Months)';
      case 'spending':
        return 'Total Subscription Expenditure by Streamer Channel ($ USD)';
      case 'tiers':
        return 'Subscription Tier Distribution (Prime vs Tier 1 / 2 / 3)';
      case 'timeline':
        return 'Subscriptions & Renewals Timeline';
      case 'gifting':
        return 'Subscription Delivery Breakdown (Direct vs Gifts)';
      default:
        return 'Subscriptions Overview';
    }
  }, [chartDimension]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-card">
        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Subs
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {analytics.total.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Recorded in file</p>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Active Subs
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {analytics.activeCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Ongoing benefits</p>
        </div>

        <div className="rounded-xl border border-[#9146FF]/30 bg-[#9146FF]/10 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#bf94ff]">
            Prime Gaming
          </p>
          <p className="text-xl font-mono font-bold text-[#bf94ff] mt-1">
            {analytics.primeCount}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Prime subs used</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Gift Subs
          </p>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">
            {analytics.giftsReceivedCount} <span className="text-xs text-gray-500 font-sans">rec</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
            {analytics.giftsSentCount > 0 ? `${analytics.giftsSentCount} sent` : 'Community gift'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Max Tenure
          </p>
          <p className="text-xl font-mono font-bold text-cyan-400 mt-1 truncate">
            {analytics.maxTenure} <span className="text-xs text-gray-500 font-sans">mo</span>
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate flex items-center gap-1.5" title={analytics.longestChannel}>
            {analytics.longestChannel && (
              <StreamerAvatar channelName={analytics.longestChannel} className="w-4 h-4 rounded-md inline-block shrink-0" />
            )}
            <span className="truncate">{analytics.longestChannel || 'N/A'}</span>
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#18181B] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Total Spend
          </p>
          <p className="text-xl font-mono font-bold text-white mt-1">
            {formatCurrency(analytics.totalEstSpend)}
          </p>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">Commerce value</p>
        </div>
      </div>

      {/* 3D Visualizer & Dynamic Multi-Chart Engine */}
      <div className="stagger-card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-gray-500 px-2 py-0.5 font-bold uppercase tracking-wider">
              Chart View:
            </span>
            <button
              onClick={() => setChartDimension('tenure')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'tenure'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Streamer Tenure (3D)
            </button>
            <button
              onClick={() => setChartDimension('spending')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'spending'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Spend by Streamer
            </button>
            <button
              onClick={() => setChartDimension('tiers')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'tiers'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tier Breakdown
            </button>
            <button
              onClick={() => setChartDimension('timeline')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'timeline'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setChartDimension('gifting')}
              className={`cursor-pointer px-2.5 py-1 rounded transition-colors ${
                chartDimension === 'gifting'
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Direct vs Gifts
            </button>
          </div>
        </div>

        <UnifiedSectionChart
          data={activeChartData}
          title={activeChartTitle}
          yAxisLabel={
            chartDimension === 'tenure'
               ? 'Tenure (Months)'
              : chartDimension === 'spending'
              ? 'Amount ($)'
              : 'Subscriptions'
          }
          metricLabel={chartDimension === 'spending' ? '$' : 'Count'}
          defaultStyle={defaultChartStyle}
          height={320}
          colorTheme={colorTheme}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="stagger-card space-y-2 bg-[#18181B] border border-white/10 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by streamer, tier, gifter, recipient, or order ID..."
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
            Showing <span className="text-white font-bold">{filteredRows.length}</span> of{' '}
            <span className="text-white font-bold">{normalizedRows.length}</span> subscriptions
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
          <span className="text-[11px] text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#9146FF]" />
            <span>Filter:</span>
          </span>

          {[
            { id: 'all', label: 'All Subs' },
            { id: 'active', label: 'Active Only' },
            { id: 'expired', label: 'Expired / Past' },
            { id: 'prime', label: 'Prime Gaming' },
            { id: 'giftsReceived', label: 'Gifts Received' },
            { id: 'giftsSent', label: 'Gifts Given' },
            { id: 'tier1', label: 'Tier 1' },
            { id: 'tier2', label: 'Tier 2' },
            { id: 'tier3', label: 'Tier 3' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`cursor-pointer px-2.5 py-0.5 rounded-full border transition-colors ${
                filterType === tab.id
                  ? 'bg-[#9146FF] border-[#9146FF] text-white font-bold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive Subscriptions Table */}
      <div className="stagger-card overflow-hidden rounded-xl border border-white/10 bg-[#18181B]">
        <div className="overflow-x-auto max-h-[580px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#252529] shadow-sm z-10 font-mono text-gray-300">
              <tr>
                <th className="border-b border-white/10 p-3 font-semibold">Streamer Channel</th>
                <th className="border-b border-white/10 p-3 font-semibold">Tier & Plan</th>
                <th className="border-b border-white/10 p-3 font-semibold">Tenure / Streak</th>
                <th className="border-b border-white/10 p-3 font-semibold">Status</th>
                <th className="border-b border-white/10 p-3 font-semibold">Start & End Dates</th>
                <th className="border-b border-white/10 p-3 font-semibold">Cost / Amount</th>
                <th className="border-b border-white/10 p-3 font-semibold">Gifting / Origin</th>
                <th className="border-b border-white/10 p-3 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-gray-400">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-sans">
                    No subscription records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((sub, idx) => {
                  const isEven = idx % 2 === 1;
                  const avatarColor = getStreamerAvatarColor(sub.channel);

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedSub(sub)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer group ${
                        isEven ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      {/* Streamer Channel with Avatar & Link */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <StreamerAvatar channelName={sub.channel} className="w-7 h-7 rounded-md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white font-sans group-hover:text-[#bf94ff] transition-colors">
                                {sub.channel}
                              </span>
                              <a
                                href={sub.channelUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-500 hover:text-white transition-colors"
                                title="Open channel on Twitch"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">
                              twitch.tv/{sub.channel.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier & Plan */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-block border ${
                            sub.isPrime
                              ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                              : sub.tier.includes('Tier 3')
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : sub.tier.includes('Tier 2')
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                              : 'bg-[#9146FF]/15 text-[#bf94ff] border-[#9146FF]/30'
                          }`}
                        >
                          {sub.tier}
                        </span>
                      </td>

                      {/* Tenure / Streak */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-gray-200">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-bold">{sub.tenureMonths}</span>
                          <span className="text-gray-500 text-[11px]">months</span>
                        </div>
                        {sub.streakMonths !== sub.tenureMonths && sub.streakMonths > 1 && (
                          <div className="text-[10px] text-gray-500">
                            Streak: {sub.streakMonths} mo
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 border ${
                            sub.isActive
                              ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/50'
                              : 'bg-white/5 text-gray-500 border-white/10'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sub.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                            }`}
                          />
                          <span>{sub.status}</span>
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="p-3 text-[11px] whitespace-nowrap">
                        <div className="text-gray-300">
                          {formatTwitchDate(sub.startDate)}
                        </div>
                        {sub.endDate && (
                          <div className="text-gray-500 text-[10px]">
                            to {formatTwitchDate(sub.endDate)}
                          </div>
                        )}
                      </td>

                      {/* Cost / Amount */}
                      <td className="p-3 text-white font-bold whitespace-nowrap">
                        {sub.formattedPrice}
                      </td>

                      {/* Gifting / Origin */}
                      <td className="p-3">
                        {sub.isGiftReceived ? (
                          <div className="flex items-center gap-1 text-amber-400 text-[11px] font-sans">
                            <Gift className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]" title={`Gifted by ${sub.gifterName || 'Community'}`}>
                              From: {sub.gifterName || 'Community'}
                            </span>
                          </div>
                        ) : sub.isGiftSent ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-sans">
                            <Gift className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]" title={`Gifted to ${sub.recipientName || 'Community'}`}>
                              To: {sub.recipientName || `${sub.giftCount} users`}
                            </span>
                          </div>
                        ) : sub.isPrime ? (
                          <span className="text-blue-400 font-sans text-[11px] flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>Prime Benefit</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-sans text-[11px]">
                            Direct Sub
                          </span>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub(sub);
                          }}
                          className="cursor-pointer px-2.5 py-1 rounded bg-white/5 hover:bg-[#9146FF] text-gray-300 hover:text-white text-[11px] transition-colors font-sans"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Full Metadata Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#18181B] border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Banner */}
            <div className="p-5 border-b border-white/10 bg-[#252529] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StreamerAvatar channelName={selectedSub.channel} className="w-10 h-10 rounded-xl" />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedSub.channel}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        selectedSub.isActive
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      {selectedSub.status}
                    </span>
                  </h3>
                  <a
                    href={selectedSub.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#bf94ff] hover:underline flex items-center gap-1 font-mono mt-0.5"
                  >
                    <span>https://twitch.tv/{selectedSub.channel.toLowerCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="cursor-pointer p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto font-mono text-xs text-gray-300">
              {/* Highlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Subscription Tier
                  </span>
                  <span className="text-sm font-bold text-white font-sans">
                    {selectedSub.tier}
                  </span>
                </div>

                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Tenure
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {selectedSub.tenureMonths} Months
                  </span>
                </div>

                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Pricing / Cost
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedSub.formattedPrice}
                  </span>
                </div>

                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Start Date
                  </span>
                  <span className="text-xs text-gray-200">
                    {formatTwitchDate(selectedSub.startDate)}
                  </span>
                </div>

                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    End / Expiration Date
                  </span>
                  <span className="text-xs text-gray-200">
                    {formatTwitchDate(selectedSub.endDate)}
                  </span>
                </div>

                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                    Next Billing / Renewal
                  </span>
                  <span className="text-xs text-gray-200">
                    {formatTwitchDate(selectedSub.renewalDate)}
                  </span>
                </div>
              </div>

              {/* Gift & Origin Info */}
              {(selectedSub.isGift || selectedSub.gifterName || selectedSub.recipientName) && (
                <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold font-sans">
                    <Gift className="w-4 h-4" />
                    <span>Gift Subscription Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-200/90 pt-1">
                    {selectedSub.gifterName && (
                      <div>
                        <span className="text-gray-400">Gifted By:</span>{' '}
                        <span className="font-bold text-white">{selectedSub.gifterName}</span>
                      </div>
                    )}
                    {selectedSub.recipientName && (
                      <div>
                        <span className="text-gray-400">Gifted To (Recipient):</span>{' '}
                        <span className="font-bold text-white">{selectedSub.recipientName}</span>
                      </div>
                    )}
                    {selectedSub.giftCount > 1 && (
                      <div>
                        <span className="text-gray-400">Quantity:</span>{' '}
                        <span className="font-bold text-white">{selectedSub.giftCount} Gifts</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order / Payment Info if present */}
              {(selectedSub.orderId || selectedSub.paymentMethod) && (
                <div className="p-3 bg-[#121214] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-gray-400 font-bold uppercase text-[10px]">
                    <CreditCard className="w-3.5 h-3.5 text-[#9146FF]" />
                    <span>Payment & Transaction Identifiers</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedSub.orderId && (
                      <div>
                        <span className="text-gray-500">Order/Invoice ID:</span>{' '}
                        <span className="text-gray-200">{selectedSub.orderId}</span>
                      </div>
                    )}
                    {selectedSub.paymentMethod && (
                      <div>
                        <span className="text-gray-500">Payment Provider:</span>{' '}
                        <span className="text-gray-200">{selectedSub.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw CSV Record Row */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Raw CSV Row Metadata
                </span>
                <pre className="p-3 bg-[#121214] border border-white/5 rounded-xl text-[11px] overflow-x-auto text-gray-300 font-mono">
                  {JSON.stringify(selectedSub.rawRow, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#252529] flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] text-white text-xs font-bold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
