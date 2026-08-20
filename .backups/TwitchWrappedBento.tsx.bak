import React, { useMemo, useRef } from 'react';
import { ZipFileEntry } from '../types';
import { Share2, Download, Trophy, Clock, MessageSquare, Zap, Target, Sparkles } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface TwitchWrappedBentoProps {
  entries: ZipFileEntry[];
  username: string;
}

export const TwitchWrappedBento: React.FC<TwitchWrappedBentoProps> = ({ entries, username }) => {
  const bentoRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => {
    let totalMinutes = 0;
    let totalMessages = 0;
    const channelWatch: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const chatChannels: Record<string, number> = {};

    // Process Watch Time
    const watchEntry = entries.find(e => e.path.toLowerCase().includes('minutes_watched.csv'));
    if (watchEntry && watchEntry.parsedData && watchEntry.parsedData.type === 'csv') {
      for (const row of watchEntry.parsedData.rows) {
        const minutes = Number(row.minutes_logged || row.minutes_watched || 0);
        const channel = String(row.channel || row.creator || '').trim();
        const dateStr = String(row.date || row.timestamp || '');

        if (minutes > 0) {
          totalMinutes += minutes;
          if (channel) {
            channelWatch[channel] = (channelWatch[channel] || 0) + minutes;
          }
        }

        if (dateStr) {
          try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              const hour = d.getHours();
              hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    // Process Chat
    const chatEntry = entries.find(e => e.path.toLowerCase().includes('chat_messages.csv'));
    if (chatEntry && chatEntry.parsedData && chatEntry.parsedData.type === 'csv') {
      totalMessages = chatEntry.parsedData.rows.length;
      for (const row of chatEntry.parsedData.rows) {
        const channel = String(row.channel || row.channel_name || '').trim();
        if (channel) {
          chatChannels[channel] = (chatChannels[channel] || 0) + 1;
        }
      }
    }

    // Top 3 Streamers
    const topStreamers = Object.entries(channelWatch)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, mins]) => ({ name, hours: (mins / 60).toFixed(1) }));

    // Prime Viewing Hours
    let peakHour = 0;
    let maxHourCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = Number(hour);
      }
    });

    // Archetype Calculation
    let archetype = 'Casual Viewer';
    let archetypeDesc = 'Just chilling and enjoying the streams.';
    let archetypeIcon = <Zap className="w-6 h-6 text-yellow-400" />;

    const uniqueWatchChannels = Object.keys(channelWatch).length;
    
    if (peakHour >= 0 && peakHour <= 5 && totalMinutes > 1000) {
      archetype = 'Night Owl Lurker';
      archetypeDesc = 'The stream is your nightlight. You rule the graveyard shift.';
    } else if (totalMessages > 5000) {
      archetype = 'Giga Chatter';
      archetypeDesc = 'Your keyboard is on fire. You drive the conversation.';
    } else if (uniqueWatchChannels > 50) {
      archetype = 'Variety Hopper';
      archetypeDesc = 'You cannot be contained. A true connoisseur of all content.';
    } else if (topStreamers.length > 0 && channelWatch[topStreamers[0].name] > totalMinutes * 0.5) {
      archetype = 'Loyal Sentinel';
      archetypeDesc = `Unwavering dedication. You basically live in ${topStreamers[0].name}'s chat.`;
    }

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      topStreamers,
      peakHour,
      totalMessages,
      archetype,
      archetypeDesc,
      archetypeIcon
    };
  }, [entries]);

  const handleDownload = async () => {
    if (!bentoRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(bentoRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0F0E11'
      });
      const link = document.createElement('a');
      link.download = `twitch-wrapped-${username.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export bento graphic', err);
    }
  };

  if (metrics.topStreamers.length === 0 && metrics.totalMessages === 0) {
    return null; // Not enough data
  }

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  return (
    <div className="rounded-xl border border-[#9146FF]/30 bg-[#121214] overflow-hidden mb-6 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#9146FF]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
      
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#9146FF]" />
          <h2 className="text-lg font-bold text-white tracking-tight">Lifetime Summary</h2>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#772ce8] transition-colors text-white text-xs font-bold font-mono shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Graphic</span>
        </button>
      </div>

      <div className="p-6 relative z-10" ref={bentoRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main Archetype Card */}
          <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-[#1c0d30] to-[#121118] border border-[#9146FF]/30 p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              {metrics.archetypeIcon}
            </div>
            <div>
              <div className="text-[#bf94ff] text-xs font-bold font-mono tracking-widest uppercase mb-1">
                Your Viewer Archetype
              </div>
              <h3 className="text-3xl font-extrabold text-white mb-2">{metrics.archetype}</h3>
              <p className="text-gray-400 text-sm max-w-md">{metrics.archetypeDesc}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div>
                <div className="text-[10px] text-gray-500 font-mono uppercase">Total Watch Time</div>
                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                  {metrics.totalHours} <span className="text-xs text-gray-400 font-normal">hrs</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-mono uppercase">Total Messages Sent</div>
                <div className="text-2xl font-bold text-white">{metrics.totalMessages.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Top Streamers Card */}
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-6 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 font-mono tracking-widest uppercase mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Top Streamers</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
              {metrics.topStreamers.map((streamer, idx) => (
                <div key={streamer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#9146FF]/20 text-[#bf94ff] flex items-center justify-center font-bold text-sm border border-[#9146FF]/30">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold truncate">{streamer.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{streamer.hours} hrs</div>
                  </div>
                </div>
              ))}
              {metrics.topStreamers.length === 0 && (
                <div className="text-sm text-gray-500 italic">No watch history found.</div>
              )}
            </div>
          </div>

          {/* Prime Time Card */}
          <div className="rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Peak Viewing Time</div>
              <div className="text-lg font-bold text-white">{formatHour(metrics.peakHour)}</div>
            </div>
          </div>
          
          {/* Top Chat Channel */}
          <div className="md:col-span-2 rounded-2xl bg-[#18181B] border border-white/10 p-5 flex items-center gap-4">
             <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Chat Activity</div>
              <div className="text-sm text-gray-300">
                You've sent <span className="text-white font-bold">{metrics.totalMessages.toLocaleString()}</span> messages across the platform.
              </div>
            </div>
          </div>

        </div>
        
        {/* Watermark for export */}
        <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-gray-600 border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            <span>Twitch GDPR/CCPA Data Export Analysis</span>
          </div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
};
