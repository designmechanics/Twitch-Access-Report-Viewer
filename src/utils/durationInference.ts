import { extractStreamerName } from './channelHelpers';

export interface InferredPlaybackRecord {
  index: number;
  originalRow: Record<string, any>;
  streamer: string;
  category: string;
  device: string;
  timestamp: number | null;
  rawDateString?: string;
  formattedDate: string;
  directMinutes: number;
  inferredMinutes: number;
  inferredHours: number;
  durationSource: 'direct' | 'channel_switch_delta' | 'session_boundary';
  nextSwitchDeltaMinutes: number | null;
  nextStreamer: string | null;
  sessionClusterId: number;
  isChannelSwitch: boolean;
  isSessionEnd: boolean;
  calculationExplanation: string;
}

export interface PlaybackInferenceSummary {
  records: InferredPlaybackRecord[];
  totalInferredMinutes: number;
  totalInferredHours: number;
  totalChannelSwitches: number;
  sessionsCount: number;
  averageSessionDurationMins: number;
  longestContinuousSessionMins: number;
  longestSessionStreamer: string;
  hasDirectDuration: boolean;
  hasInferredDeltas: boolean;
  first15Audit: InferredPlaybackRecord[];
}

/**
 * Safely parses any date or timestamp representation from Twitch CSV exports.
 */
export function parseTwitchTimestamp(row: Record<string, any>): { timestamp: number | null; rawString?: string } {
  const possibleFields = [
    'time',
    'timestamp',
    'epoch_time',
    'played_at',
    'created_at',
    'started_at',
    'date',
    'watch_date',
    'event_time',
    'login_time',
    'action_time'
  ];

  for (const field of possibleFields) {
    const val = row[field];
    if (val !== undefined && val !== null && val !== '') {
      const str = String(val).trim();
      
      // Numeric epoch check (seconds or milliseconds)
      if (/^\d{10,13}$/.test(str)) {
        const num = Number(str);
        const epochMs = str.length === 10 ? num * 1000 : num;
        if (!isNaN(epochMs) && epochMs > 946684800000 && epochMs < 2524608000000) { // between year 2000 and 2050
          return { timestamp: epochMs, rawString: str };
        }
      }

      // Standard ISO / UTC / Date parser
      const parsed = Date.parse(str);
      if (!isNaN(parsed) && parsed > 946684800000) {
        return { timestamp: parsed, rawString: str };
      }
    }
  }

  return { timestamp: null, rawString: undefined };
}

/**
 * Extracts directly supplied duration from rows if present (e.g. minutes_watched, duration_seconds)
 */
export function extractDirectDurationMinutes(row: Record<string, any>): number {
  const directMinFields = ['minutes_watched', 'duration_minutes', 'minutes', 'watch_time', 'view_minutes'];
  for (const f of directMinFields) {
    if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
      const num = Number(row[f]);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  const directSecFields = ['duration_seconds', 'watch_time_seconds', 'play_duration', 'length', 'duration_sec', 'seconds'];
  for (const f of directSecFields) {
    if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
      const num = Number(row[f]);
      if (!isNaN(num) && num > 0) return +(num / 60).toFixed(2);
    }
  }

  return 0;
}

/**
 * Reconstructs watch sessions and infers playback durations between channel switches
 * for video_play.csv, minutes_watched.csv, and sequential event logs.
 */
export function inferPlaybackSessionsAndDurations(rawRows: Record<string, any>[]): PlaybackInferenceSummary {
  if (!rawRows || rawRows.length === 0) {
    return {
      records: [],
      totalInferredMinutes: 0,
      totalInferredHours: 0,
      totalChannelSwitches: 0,
      sessionsCount: 0,
      averageSessionDurationMins: 0,
      longestContinuousSessionMins: 0,
      longestSessionStreamer: 'None',
      hasDirectDuration: false,
      hasInferredDeltas: false,
      first15Audit: []
    };
  }

  // Check if rows have explicit direct duration
  let directDurationCount = 0;
  for (const r of rawRows.slice(0, 50)) {
    if (extractDirectDurationMinutes(r) > 0) {
      directDurationCount++;
    }
  }
  const hasDirectDuration = directDurationCount > 5;

  // Map and attach parsed timestamp and metadata
  const mapped = rawRows.map((row, idx) => {
    const { timestamp, rawString } = parseTwitchTimestamp(row);
    const directMinutes = extractDirectDurationMinutes(row);
    const streamer = extractStreamerName(row, 'General Streamer');
    const category = String(row.category_name || row.game || row.category || row.content_type || 'General Broadcast').trim();
    const device = String(row.device_type || row.client_platform || row.device || row.platform || row.user_agent || 'Desktop / Web').trim();

    return {
      originalIndex: idx,
      originalRow: row,
      timestamp,
      rawDateString: rawString,
      streamer,
      category,
      device,
      directMinutes
    };
  });

  // Check if we can sort by timestamp
  const timestampedRows = mapped.filter((r) => r.timestamp !== null);
  const hasTimestamps = timestampedRows.length >= mapped.length * 0.5;

  // If timestamps exist, sort chronologically for interval delta calculations
  const sorted = hasTimestamps
    ? [...mapped].sort((a, b) => {
        if (a.timestamp === null) return 1;
        if (b.timestamp === null) return -1;
        return a.timestamp - b.timestamp;
      })
    : mapped;

  let sessionClusterId = 1;
  let currentSessionMinutes = 0;
  let longestSessionMins = 0;
  let longestSessionStreamer = 'General Streamer';
  let totalChannelSwitches = 0;

  const enrichedRecords: InferredPlaybackRecord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    let inferredMinutes = 0;
    let durationSource: 'direct' | 'channel_switch_delta' | 'session_boundary' = 'direct';
    let nextSwitchDeltaMinutes: number | null = null;
    let nextStreamer: string | null = next ? next.streamer : null;
    let isChannelSwitch = false;
    let isSessionEnd = false;
    let calculationExplanation = '';

    if (hasDirectDuration && current.directMinutes > 0) {
      // Direct telemetry field
      inferredMinutes = current.directMinutes;
      durationSource = 'direct';
      calculationExplanation = `Direct log metric: ${current.directMinutes.toFixed(1)} mins recorded by Twitch.`;
    } else if (current.timestamp !== null && next && next.timestamp !== null) {
      // Calculate delta to next sequential playback event or channel switch
      const deltaMs = next.timestamp - current.timestamp;
      const deltaMins = deltaMs / 60000;

      if (deltaMins >= 0.1 && deltaMins <= 180) {
        // Continuous session or channel switch within 3 hours
        inferredMinutes = +deltaMins.toFixed(1);
        durationSource = 'channel_switch_delta';
        nextSwitchDeltaMinutes = inferredMinutes;

        if (next.streamer !== current.streamer) {
          isChannelSwitch = true;
          totalChannelSwitches++;
          calculationExplanation = `Channel switch to ${next.streamer} after ${formatMinutesToHoursMinutes(inferredMinutes)}.`;
        } else {
          calculationExplanation = `Sequential playback on ${current.streamer}: ${formatMinutesToHoursMinutes(inferredMinutes)}.`;
        }
      } else {
        // Large gap (> 3 hours) indicates session conclusion
        inferredMinutes = 15; // Inferred standard session floor
        durationSource = 'session_boundary';
        isSessionEnd = true;
        calculationExplanation = `Session boundary (gap of ${deltaMins > 0 ? (deltaMins / 60).toFixed(1) + ' hrs' : 'negative gap'}). Assigned standard 15m session floor.`;
      }
    } else {
      // Fallback if no next timestamp
      inferredMinutes = current.directMinutes > 0 ? current.directMinutes : 15;
      durationSource = current.directMinutes > 0 ? 'direct' : 'session_boundary';
      isSessionEnd = true;
      calculationExplanation = current.directMinutes > 0
        ? `Direct entry: ${current.directMinutes} mins.`
        : `Final sequence record. Estimated 15 mins watch duration.`;
    }

    currentSessionMinutes += inferredMinutes;

    if (currentSessionMinutes > longestSessionMins) {
      longestSessionMins = currentSessionMinutes;
      longestSessionStreamer = current.streamer;
    }

    if (isSessionEnd) {
      sessionClusterId++;
      currentSessionMinutes = 0;
    }

    const formattedDate = current.timestamp
      ? new Date(current.timestamp).toLocaleString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : current.rawDateString || 'Unknown Time';

    enrichedRecords.push({
      index: i + 1,
      originalRow: current.originalRow,
      streamer: current.streamer,
      category: current.category,
      device: current.device,
      timestamp: current.timestamp,
      rawDateString: current.rawDateString,
      formattedDate,
      directMinutes: current.directMinutes,
      inferredMinutes: +inferredMinutes.toFixed(1),
      inferredHours: +(inferredMinutes / 60).toFixed(2),
      durationSource,
      nextSwitchDeltaMinutes,
      nextStreamer,
      sessionClusterId,
      isChannelSwitch,
      isSessionEnd,
      calculationExplanation
    });
  }

  const totalInferredMinutes = enrichedRecords.reduce((acc, r) => acc + r.inferredMinutes, 0);
  const totalInferredHours = +(totalInferredMinutes / 60).toFixed(1);
  const averageSessionDurationMins = enrichedRecords.length > 0 ? +(totalInferredMinutes / enrichedRecords.length).toFixed(1) : 0;

  return {
    records: enrichedRecords,
    totalInferredMinutes: +totalInferredMinutes.toFixed(1),
    totalInferredHours,
    totalChannelSwitches,
    sessionsCount: sessionClusterId,
    averageSessionDurationMins,
    longestContinuousSessionMins: +longestSessionMins.toFixed(1),
    longestSessionStreamer,
    hasDirectDuration,
    hasInferredDeltas: hasTimestamps,
    first15Audit: enrichedRecords.slice(0, 15)
  };
}

/**
 * Helper to display minutes in human readable Xh Ym format
 */
export function formatMinutesToHoursMinutes(mins: number): string {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${mins.toFixed(1)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}
