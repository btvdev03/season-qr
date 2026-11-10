/**
 * SeasonQR - Global & Local QR Creation Tracker
 *
 * Tracks the total number of QR codes generated across all users globally (via CountAPI)
 * with eager pre-fetching on bundle load, automatic retry, cache: 'no-store' live accuracy,
 * and offline localStorage fallback.
 */

const COUNT_API_KEY = 'btvdev03_season_qr_created';
const COUNT_API_BASE = 'https://countapi.mileshilliard.com/api/v1';

const LOCAL_USER_COUNT_KEY = 'season_qr_local_user_creations';
const LOCAL_GLOBAL_CACHE_KEY = 'season_qr_cached_global_creations';

// Initial baseline offset preserved for continuity
const BASELINE_OFFSET = 128;

export interface QRStats {
  globalCount: number;
  userCount: number;
  isLoading: boolean;
}

/**
 * Reads the cached user creation count from localStorage
 */
export function getLocalUserCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(LOCAL_USER_COUNT_KEY);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Reads the cached global count from localStorage.
 * Returns null when the user visits for the very first time (no cache yet),
 * avoiding flashing an outdated baseline number while live data loads.
 */
export function getCachedGlobalCount(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(LOCAL_GLOBAL_CACHE_KEY);
    if (!val) return null;
    const parsed = parseInt(val, 10);
    return Number.isFinite(parsed) && parsed > BASELINE_OFFSET ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchLiveFromServer(attemptTimeoutMs: number = 8000): Promise<number | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);
  try {
    const res = await fetch(`${COUNT_API_BASE}/get/${COUNT_API_KEY}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawVal = Number(data?.value);
      if (Number.isFinite(rawVal) && rawVal >= 0) {
        const total = rawVal + BASELINE_OFFSET;
        try {
          localStorage.setItem(LOCAL_GLOBAL_CACHE_KEY, total.toString());
        } catch {
          // Ignore localStorage quota/privacy errors
        }
        return total;
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

async function performLiveFetchWithRetry(): Promise<number> {
  // Primary live attempt
  const firstTry = await fetchLiveFromServer(8000);
  if (firstTry !== null) return firstTry;

  // Quick automatic retry for slow mobile networks or cold TLS handshakes
  const secondTry = await fetchLiveFromServer(8000);
  if (secondTry !== null) return secondTry;

  // True offline fallback
  return getCachedGlobalCount() ?? BASELINE_OFFSET;
}

// Kick off eager live fetch immediately upon module parse (parallel to Three.js init)
let eagerInitialPromise: Promise<number> | null =
  typeof window !== 'undefined' ? performLiveFetchWithRetry() : null;

/**
 * Fetches the latest global QR creation count without incrementing.
 * Uses the eager in-flight request on initial mount so the true live count appears immediately.
 */
export async function fetchGlobalQRCount(forceFresh: boolean = false): Promise<number> {
  if (!forceFresh && eagerInitialPromise) {
    const result = await eagerInitialPromise;
    eagerInitialPromise = null; // Consume initial eager promise; subsequent calls fetch fresh
    return result;
  }
  return performLiveFetchWithRetry();
}

/**
 * Increments the global and local QR creation count.
 * Called when a user enters a new URL or clicks a shortcut link.
 */
export async function recordQRGeneration(): Promise<{ globalCount: number; userCount: number }> {
  const userCount = getLocalUserCount() + 1;
  try {
    localStorage.setItem(LOCAL_USER_COUNT_KEY, userCount.toString());
  } catch {
    // Ignore localStorage errors
  }

  let globalCount = (getCachedGlobalCount() ?? BASELINE_OFFSET) + 1;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${COUNT_API_BASE}/hit/${COUNT_API_KEY}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawVal = Number(data?.value);
      if (Number.isFinite(rawVal) && rawVal >= 0) {
        globalCount = rawVal + BASELINE_OFFSET;
        try {
          localStorage.setItem(LOCAL_GLOBAL_CACHE_KEY, globalCount.toString());
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[QR Counter] Global hit failed, cached local increment:', err);
  }

  return { globalCount, userCount };
}

/**
 * Formats count into human-friendly representation (e.g., 146 or 1.2k)
 */
export function formatCount(count: number | null, compact: boolean = false): string {
  if (count === null) return '...';
  if (compact && count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toLocaleString('vi-VN');
}
