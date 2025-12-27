import { Redis } from "@upstash/redis";

// Initialize Redis client only if credentials are available
// Falls back to no caching if Redis is unavailable
export let redis: Redis | null = null;

try {
  const redisUrl = process.env.UPSTASH_REDIS_URL;
  const redisToken = process.env.UPSTASH_REDIS_TOKEN;

  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    console.log("Redis cache initialized");
  } else {
    console.warn("Redis credentials not found - caching disabled");
  }
} catch (error) {
  console.warn("Failed to initialize Redis - caching disabled:", error);
  redis = null;
}

// Cache keys
const CACHE_KEY_HOLDERS = "atp:holders";
const CACHE_KEY_ATPS = "atp:atps";
const CACHE_KEY_STATS = "atp:stats";
const CACHE_KEY_LAST_REFRESH = "atp:last_refresh";
const CACHE_KEY_HOLDERS_LAST_REFRESH = "atp:holders:last_refresh";

// Refresh interval: 1 day (86400 seconds)
const REFRESH_INTERVAL = 86400;

/**
 * Get cached holders data
 */
export async function getCachedHolders() {
  if (!redis) return null;
  try {
    const cached = await redis.get(CACHE_KEY_HOLDERS);
    if (!cached) return null;
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  } catch (error) {
    console.warn("Error reading holders cache:", error);
    return null;
  }
}

/**
 * Set cached holders data (persists forever, no TTL)
 */
export async function setCachedHolders(data: unknown) {
  if (!redis) return;
  try {
    await redis.set(CACHE_KEY_HOLDERS, JSON.stringify(data));
  } catch (error) {
    console.warn("Error writing holders cache:", error);
  }
}

/**
 * Get cached ATPs data
 */
export async function getCachedATPs() {
  if (!redis) return null;
  try {
    const cached = await redis.get(CACHE_KEY_ATPS);
    if (!cached) return null;
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  } catch (error) {
    console.warn("Error reading ATPs cache:", error);
    return null;
  }
}

/**
 * Set cached ATPs data (persists forever, no TTL)
 */
export async function setCachedATPs(data: unknown) {
  if (!redis) return;
  try {
    await redis.set(CACHE_KEY_ATPS, JSON.stringify(data));
  } catch (error) {
    console.warn("Error writing ATPs cache:", error);
  }
}

/**
 * Get cached complete stats data (includes lastUpdated timestamp)
 */
export async function getCachedStats() {
  if (!redis) return null;
  try {
    const cached = await redis.get(CACHE_KEY_STATS);
    if (!cached) return null;
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  } catch (error) {
    console.warn("Error reading stats cache:", error);
    return null;
  }
}

/**
 * Set cached complete stats data (includes lastUpdated timestamp)
 * Persists forever, no TTL
 */
export async function setCachedStats(data: unknown) {
  if (!redis) return;
  try {
    await redis.set(CACHE_KEY_STATS, JSON.stringify(data));
  } catch (error) {
    console.warn("Error writing stats cache:", error);
  }
}

/**
 * Get last refresh timestamp
 */
export async function getLastRefresh(): Promise<number | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get(CACHE_KEY_LAST_REFRESH);
    if (!cached) return null;
    return typeof cached === "string" ? parseInt(cached, 10) : Number(cached);
  } catch (error) {
    console.warn("Error reading last refresh:", error);
    return null;
  }
}

/**
 * Set last refresh timestamp
 */
export async function setLastRefresh(timestamp: number) {
  if (!redis) return;
  try {
    await redis.set(CACHE_KEY_LAST_REFRESH, timestamp.toString());
  } catch (error) {
    console.warn("Error writing last refresh:", error);
  }
}

/**
 * Get last refresh timestamp for holders
 */
export async function getHoldersLastRefresh(): Promise<number | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get(CACHE_KEY_HOLDERS_LAST_REFRESH);
    if (!cached) return null;
    return typeof cached === "string" ? parseInt(cached, 10) : Number(cached);
  } catch (error) {
    console.warn("Error reading holders last refresh:", error);
    return null;
  }
}

/**
 * Set last refresh timestamp for holders
 */
export async function setHoldersLastRefresh(timestamp: number) {
  if (!redis) return;
  try {
    await redis.set(CACHE_KEY_HOLDERS_LAST_REFRESH, timestamp.toString());
  } catch (error) {
    console.warn("Error writing holders last refresh:", error);
  }
}

/**
 * Check if refresh should be skipped (within 90% of refresh interval)
 */
export async function shouldSkipRefresh(): Promise<boolean> {
  if (!redis) return false;

  const lastRefresh = await getLastRefresh();
  if (!lastRefresh) return false;

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeSinceRefresh = now - lastRefresh;
  const skipThreshold = REFRESH_INTERVAL * 0.9; // 90% of refresh interval

  return timeSinceRefresh < skipThreshold;
}

/**
 * Check if holders refresh should be skipped (within 90% of refresh interval)
 */
export async function shouldSkipHoldersRefresh(): Promise<boolean> {
  if (!redis) return false;

  const lastRefresh = await getHoldersLastRefresh();
  if (!lastRefresh) return false;

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeSinceRefresh = now - lastRefresh;
  const skipThreshold = REFRESH_INTERVAL * 0.9; // 90% of refresh interval

  return timeSinceRefresh < skipThreshold;
}

/**
 * Clear all cache
 */
export async function clearCache() {
  if (!redis) return;
  try {
    await redis.del(
      CACHE_KEY_HOLDERS,
      CACHE_KEY_ATPS,
      CACHE_KEY_STATS,
      CACHE_KEY_LAST_REFRESH,
      CACHE_KEY_HOLDERS_LAST_REFRESH,
    );
  } catch (error) {
    console.warn("Error clearing cache:", error);
  }
}
