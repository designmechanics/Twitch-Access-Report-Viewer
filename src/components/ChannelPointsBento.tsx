import React, { useMemo } from 'react';
import { ZipFileEntry } from '../types';
import { Target, TrendingUp, TrendingDown, Award, Gift, Zap } from 'lucide-react';

interface ChannelPointsBentoProps {
  entries: ZipFileEntry[];
}

export const ChannelPointsBento: React.FC<ChannelPointsBentoProps> = ({ entries }) => {

  const pointsStats = useMemo(() => {
    let totalWagered = 0;
    let totalWon = 0;
    let biggestWin = 0;
    let worstBeat = 0;
    let customRewardsCount = 0;

    // Look for points/predictions files
    const predictionsEntry = entries.find(e => 
      e.path.toLowerCase().includes('prediction') || 
      e.path.toLowerCase().includes('points') ||
      e.path.toLowerCase().includes('reward')
    );
    
    if (predictionsEntry && predictionsEntry.parsedData && predictionsEntry.parsedData.type === 'csv') {
      for (const row of predictionsEntry.parsedData.rows) {
        const action = String(row.action || row.type || row.status || row.outcome || '').toLowerCase();
        const points = Number(row.points || row.amount || row.cost || row.wager || 0);
        const rewardTitle = String(row.reward_title || row.title || '');

        if (action.includes('prediction') || action.includes('wager') || action.includes('bet')) {
          if (action.includes('win') || action.includes('won') || action.includes('success')) {
            totalWon += points;
            if (points > biggestWin) biggestWin = points;
          } else if (action.includes('loss') || action.includes('lost') || action.includes('fail')) {
            totalWagered += points;
            if (points > worstBeat) worstBeat = points;
          } else {
            // Assume wagered if not resolved yet or just generic
            totalWagered += points;
          }
        } else if (action.includes('reward') || action.includes('redemption') || rewardTitle) {
          customRewardsCount++;
        }
      }
    }

    return {
      totalWagered,
      totalWon,
      biggestWin,
      worstBeat,
      customRewardsCount,
      hasData: !!predictionsEntry && (totalWagered > 0 || totalWon > 0 || customRewardsCount > 0)
    };
  }, [entries]);

  if (!pointsStats.hasData) {
    return null; // Not enough data
  }

  const winRatio = pointsStats.totalWagered > 0 
    ? ((pointsStats.totalWon / (pointsStats.totalWagered + pointsStats.totalWon)) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-[#121214] overflow-hidden mb-6 relative mt-6">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10 bg-gradient-to-r from-cyan-950/20 to-transparent">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">The Gambler's Ledger (Channel Points)</h2>
        </div>
      </div>

      <div className="p-6 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Win Ratio Card */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-[#121118] border border-cyan-500/30 p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="text-cyan-400 text-xs font-bold font-mono tracking-widest uppercase mb-2">
            Prediction Win Rate
          </div>
          <h3 className="text-4xl font-extrabold text-white mb-1">
            {winRatio}%
          </h3>
          <p className="text-gray-400 text-xs font-mono">
            Based on {pointsStats.totalWon.toLocaleString()} pts won vs {(pointsStats.totalWagered + pointsStats.totalWon).toLocaleString()} pts total wagered
          </p>
        </div>

        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Biggest Win</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">+{pointsStats.biggestWin.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 font-mono">Channel Points</div>
        </div>

        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Worst Beat</span>
          </div>
          <div className="text-2xl font-bold text-rose-400">-{pointsStats.worstBeat.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500 font-mono">Channel Points</div>
        </div>

        <div className="md:col-span-4 rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Custom Rewards Redeemed</div>
            <div className="text-lg font-bold text-white">{pointsStats.customRewardsCount.toLocaleString()} redemptions</div>
          </div>
        </div>

      </div>
    </div>
  );
};
