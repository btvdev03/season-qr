/**
 * SeasonQR - Global & Local QR Creation Tracker
 *
 * Tracks the total number of QR codes generated across all users globally (via CountAPI)
 * with robust offline localStorage fallback and per-device user generation counts.
 */

const COUNT_API_KEY = 'btvdev03_season_qr_created';
const COUNT_API_BASE = 'https://countapi.mileshilliard.com/api/v1';

const LOCAL_USER_COUNT_KEY = 'season_qr_local_user_creations';
const LOCAL_GLOBAL_CACHE_KEY = 'season_qr_cached_global_creations';

// Initial baseline count so the counter starts with realistic community volume
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
 * Reads the cached global count from localStorage
 */
export function getCachedGlobalCount(): number {
  if (typeof window === 'undefined') return BASELINE_OFFSET;
  try {
    const val = localStorage.getItem(LOCAL_GLOBAL_CACHE_KEY);
    return val ? Math.max(BASELINE_OFFSET, parseInt(val, 10) || BASELINE_OFFSET) : BASELINE_OFFSET;
  } catch {
    return BASELINE_OFFSET;
  }
}

/**
 * Fetches the current global QR creation count without incrementing
 */
export async function fetchGlobalQRCount(): Promise<number> {
  const cached = getCachedGlobalCount();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${COUNT_API_BASE}/get/${COUNT_API_KEY}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (typeof data.value === 'number') {
        const total = data.value + BASELINE_OFFSET;
        try {
          localStorage.setItem(LOCAL_GLOBAL_CACHE_KEY, total.toString());
        } catch {
          // Ignore localStorage errors
        }
        return total;
      }
    }
  } catch (err) {
    console.warn('[QR Counter] Using cached global count:', err);
  }
  return cached;
}

/**
 * Increments the global and local QR creation count
 * Called when a user successfully enters a new URL or clicks a preset
 */
export async function recordQRGeneration(): Promise<{ globalCount: number; userCount: number }> {
  // 1. Increment local count
  let userCount = getLocalUserCount() + 1;
  try {
    localStorage.setItem(LOCAL_USER_COUNT_KEY, userCount.toString());
  } catch {
    // Ignore localStorage errors
  }

  // 2. Increment global count via API
  let globalCount = getCachedGlobalCount() + 1;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${COUNT_API_BASE}/hit/${COUNT_API_KEY}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (typeof data.value === 'number') {
        globalCount = data.value + BASELINE_OFFSET;
        try {
          localStorage.setItem(LOCAL_GLOBAL_CACHE_KEY, globalCount.toString());
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  } catch (err) {
    console.warn('[QR Counter] Global hit failed, cached local increment:', err);
  }

  return { globalCount, userCount };
}

/**
 * Formats count into human-friendly representation (e.g., 1,280 or 1.2K)
 */
export function formatCount(count: number, compact: boolean = false): string {
  if (compact && count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toLocaleString('vi-VN');
}
