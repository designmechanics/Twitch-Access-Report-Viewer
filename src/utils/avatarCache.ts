// Dedicated Twitch Avatar Resolver with Batching & LocalStorage Caching

const CACHE_KEY = 'twitch_avatar_cache_v4'; // Bumped version to invalidate poisoned caches
const memoryCache = new Map<string, string>();

// Initialize from localStorage
try {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => {
      if (typeof v === 'string') {
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
const pendingBatch = new Set<string>();
const requestedSet = new Set<string>();
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
      const foundLogins = new Set<string>();
      if (Array.isArray(data)) {
        data.forEach((user: any) => {
          if (user && user.login) {
            const loginLower = user.login.toLowerCase();
            foundLogins.add(loginLower);
            if (user.logo && typeof user.logo === 'string') {
              memoryCache.set(loginLower, user.logo);
            } else {
              memoryCache.set(loginLower, 'NO_AVATAR');
            }
          }
        });
      }
      
      // For any username not found by IVR, try decapi.me individually before giving up
      const missing = usernames.filter(u => !foundLogins.has(u));
      if (missing.length > 0) {
        await Promise.all(missing.map(async (u) => {
          try {
            const decapiRes = await fetch(`https://decapi.me/twitch/avatar/${u}`);
            if (decapiRes.ok) {
              const text = await decapiRes.text();
              if (text && text.startsWith('http')) {
                memoryCache.set(u, text);
                return;
              }
            }
          } catch (e) {
            // Ignore decapi errors
          }
          // Definitive NO_AVATAR if both failed
          memoryCache.set(u, 'NO_AVATAR');
        }));
      }

      persistCache();
      notifyListeners();
    } else {
      // API error (rate limit, etc). DO NOT persist NO_AVATAR to localStorage!
      // Set in memory as NO_AVATAR to prevent infinite loops during this session.
      usernames.forEach((u) => memoryCache.set(u, 'NO_AVATAR'));
      notifyListeners();
    }
  } catch (err) {
    console.warn('Failed to fetch Twitch avatars from IVR:', err);
    // Network error. DO NOT persist.
    usernames.forEach((u) => memoryCache.set(u, 'NO_AVATAR'));
    notifyListeners();
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

  if (!requestedSet.has(clean)) {
    requestedSet.add(clean);
    pendingBatch.add(clean);
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        batchTimeout = null;
        processBatch();
      }, 50);
    }
  }

  return null;
}

export function markAvatarFailed(channelName: string) {
  if (!channelName) return;
  const clean = channelName.trim().replace(/^@/, '').toLowerCase();
  if (!clean) return;
  memoryCache.set(clean, 'NO_AVATAR');
  persistCache();
}


