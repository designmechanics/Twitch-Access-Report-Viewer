export function getCategoryForPath(path: string): string {
  const lower = path.toLowerCase();
  
  if (lower.includes('chat') || lower.includes('message') || lower.includes('emotes')) {
    return 'Chat & Messages';
  }
  if (lower.includes('watch') || lower.includes('video') || lower.includes('playback') || lower.includes('stream')) {
    return 'Watch Time & Streams';
  }
  if (lower.includes('sub') || lower.includes('bits') || lower.includes('payment') || lower.includes('purchase') || lower.includes('financial') || lower.includes('revenue')) {
    return 'Subscriptions & Bits';
  }
  if (lower.includes('account') || lower.includes('user') || lower.includes('login') || lower.includes('session') || lower.includes('security') || lower.includes('privacy') || lower.includes('profile')) {
    return 'Account & Security';
  }
  if (lower.includes('channel_point') || lower.includes('point') || lower.includes('prediction') || lower.includes('reward')) {
    return 'Channel Points & Rewards';
  }
  if (lower.includes('follow') || lower.includes('friend') || lower.includes('block') || lower.includes('whisper')) {
    return 'Community & Social';
  }
  if (lower.includes('mod') || lower.includes('ban') || lower.includes('timeout') || lower.includes('report') || lower.includes('strike')) {
    return 'Moderation & Safety';
  }
  if (lower.includes('survey') || lower.includes('feedback') || lower.includes('support') || lower.includes('ticket')) {
    return 'Support & Feedback';
  }
  return 'General Data';
}

export function getFileIconColor(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'csv':
      return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
    case 'json':
      return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
    case 'txt':
    case 'log':
      return 'text-sky-400 bg-sky-950/40 border-sky-800/50';
    default:
      return 'text-slate-400 bg-slate-900 border-slate-800';
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
