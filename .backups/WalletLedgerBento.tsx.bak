import React, { useMemo, useRef } from 'react';
import { ZipFileEntry } from '../types';
import { DollarSign, Gift, Star, TrendingUp, Trophy, ArrowRight, Wallet, History, Zap } from 'lucide-react';
import { extractNormalizedSub } from '../utils/channelHelpers';
import * as htmlToImage from 'html-to-image';

interface WalletLedgerBentoProps {
  entries: ZipFileEntry[];
  username: string;
}

export const WalletLedgerBento: React.FC<WalletLedgerBentoProps> = ({ entries, username }) => {
  const bentoRef = useRef<HTMLDivElement>(null);

  const financials = useMemo(() => {
    let totalSpend = 0;
    let totalSubs = 0;
    let totalGifted = 0;
    let totalPrime = 0;
    let totalBits = 0;
    
    const channelSpend: Record<string, number> = {};

    // Process Subscriptions
    const subEntry = entries.find(e => e.path.toLowerCase().includes('subscriptions.csv'));
    if (subEntry && subEntry.parsedData && subEntry.parsedData.type === 'csv') {
      for (const row of subEntry.parsedData.rows) {
        const sub = extractNormalizedSub(row);
        let cost = 0;
        
        if (sub.isGift) {
          totalGifted++;
          // Assuming the user received the gift if they are in the report, or did they send it?
          // We will count it as $0 spend if they received it, but let's assume they bought it if it's in their ledger.
          // Wait, standard Twitch exports list received gifts too. Let's just calculate estimated value.
          cost = 4.99;
        } else if (sub.tier === 'Prime') {
          totalPrime++;
          cost = 0; // Free with Amazon
        } else if (sub.tier === 'Tier 1') {
          cost = 4.99;
        } else if (sub.tier === 'Tier 2') {
          cost = 9.99;
        } else if (sub.tier === 'Tier 3') {
          cost = 24.99;
        }

        totalSubs++;
        
        // We only add to total spend if it's not a received gift
        // Without knowing if sent or received, we'll estimate total value instead of direct out-of-pocket
        const value = cost;
        totalSpend += value;
        
        if (sub.channel) {
          channelSpend[sub.channel] = (channelSpend[sub.channel] || 0) + value;
        }
      }
    }

    // Process Bits
    const bitsEntry = entries.find(e => e.path.toLowerCase().includes('bits') || e.path.toLowerCase().includes('cheer'));
    if (bitsEntry && bitsEntry.parsedData && bitsEntry.parsedData.type === 'csv') {
      for (const row of bitsEntry.parsedData.rows) {
        const bits = Number(row.bits || row.amount || row.bits_used || 0);
        const channel = String(row.channel || row.broadcaster || '').trim();
        if (bits > 0) {
          totalBits += bits;
          // 1 bit = $0.01 roughly in terms of spend/value
          const value = bits * 0.01;
          totalSpend += value;
          if (channel) {
            channelSpend[channel] = (channelSpend[channel] || 0) + value;
          }
        }
      }
    }

    // Top Channels
    const topSupported = Object.entries(channelSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));

    return {
      totalSpend,
      totalSubs,
      totalGifted,
      totalPrime,
      totalBits,
      topSupported
    };
  }, [entries]);

  if (financials.totalSpend === 0 && financials.totalBits === 0 && financials.totalSubs === 0) {
    return null; // Not enough financial data
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[#121214] overflow-hidden mb-6 relative mt-6">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-gradient-to-r from-emerald-950/20 to-transparent">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Financial & Micro-Transaction Ledger</h2>
        </div>
      </div>

      <div className="p-6 relative z-10" ref={bentoRef}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Main Spend Card */}
          <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-[#121118] border border-emerald-500/30 p-6 flex flex-col justify-center relative overflow-hidden">
            <div className="text-emerald-400/50 absolute top-4 right-4">
              <DollarSign className="w-12 h-12" />
            </div>
            <div className="text-emerald-400 text-xs font-bold font-mono tracking-widest uppercase mb-2">
              Lifetime Support Value
            </div>
            <h3 className="text-4xl font-extrabold text-white mb-1">
              {formatCurrency(financials.totalSpend)}
            </h3>
            <p className="text-gray-400 text-xs font-mono">
              Estimated total value (USD) across Subs & Bits
            </p>
          </div>

          {/* Leaderboard Card */}
          <div className="md:col-span-2 rounded-2xl bg-[#18181B] border border-white/10 p-6 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 font-mono tracking-widest uppercase mb-4">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Support Leaderboard</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
              {financials.topSupported.map((streamer, idx) => (
                <div key={streamer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="text-white font-bold truncate">{streamer.name}</div>
                    <div className="text-xs text-emerald-400 font-mono font-bold">{formatCurrency(streamer.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#9146FF]/20 text-[#bf94ff] border border-[#9146FF]/30">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Total Subs</div>
              <div className="text-lg font-bold text-white">{financials.totalSubs.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Prime Uses</div>
              <div className="text-lg font-bold text-white">{financials.totalPrime.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Gifted Subs</div>
              <div className="text-lg font-bold text-white">{financials.totalGifted.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Total Bits</div>
              <div className="text-lg font-bold text-white">{financials.totalBits.toLocaleString()}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
