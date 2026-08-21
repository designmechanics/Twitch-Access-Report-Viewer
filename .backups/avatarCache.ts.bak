// Dedicated Twitch Avatar Resolver with Batching & LocalStorage Caching

const CACHE_KEY = 'twitch_avatar_cache_v2';
const memoryCache = new Map<string, string>();

// Initialize from localStorage
try {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => {
      if (typeof v === 'string' && v.startsWith('http')) {
        memoryCache.set(k.toLowerCase(), v);
      }
    });
  }
} catch {
  // Ignore localStorage errors
}

function persistCache() {
  try {
    const obj: Record<string, string> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage quota
  }
}

// Queue for batch fetching usernames
let pendingBatch = new Set<string>();
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function subscribeAvatarCache(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

async function processBatch() {
  if (pendingBatch.size === 0) return;
  const usernames = Array.from(pendingBatch).slice(0, 50); // Fetch up to 50 at a time
  usernames.forEach((u) => pendingBatch.delete(u));

  try {
    const query = usernames.map((u) => encodeURIComponent(u)).join(',');
    const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${query}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        let updated = false;
        data.forEach((user: any) => {
          if (user && user.login && user.logo) {
            memoryCache.set(user.login.toLowerCase(), user.logo);
            updated = true;
          }
        });
        if (updated) {
          persistCache();
          notifyListeners();
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Twitch avatars from IVR:', err);
  }

  // If remaining in batch, process next chunk
  if (pendingBatch.size > 0) {
    setTimeout(processBatch, 200);
  }
}

export function requestStreamerAvatar(channelName: string): string | null {
  if (!channelName) return null;
  const clean = channelName.trim().replace(/^@/, '').toLowerCase();
  if (!clean) return null;

  if (memoryCache.has(clean)) {
    return memoryCache.get(clean)!;
  }

  // Add to batch queue if not already queued
  pendingBatch.add(clean);
  if (!batchTimeout) {
    batchTimeout = setTimeout(() => {
      batchTimeout = null;
      processBatch();
    }, 50);
  }

  return null;
}
