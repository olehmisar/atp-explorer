import { Redis } from "@upstash/redis";

// Initialize Redis client only if credentials are available
// Falls back to no caching if Redis is unavailable
let redis: Redis | null = null;

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

// Cache key for ATP stats
const CACHE_KEY = "atp:stats";

// Cache TTL: 15 minutes (900 seconds)
const CACHE_TTL = 900;

/**
 * Get cached ATP stats data
 * Returns null if cache is unavailable or on any error
 */
export async function getCachedStats() {
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get(CACHE_KEY);
    if (!cached) {
      return null;
    }

    // Upstash Redis may return the data already parsed or as a string
    // Handle both cases
    if (typeof cached === "string") {
      return JSON.parse(cached);
    } else if (typeof cached === "object") {
      // Already parsed, return as-is
      return cached;
    }

    return null;
  } catch (error) {
    // Log error but don't throw - gracefully degrade to no caching
    console.warn("Error reading from cache (falling back to no cache):", error);
    return null;
  }
}

/**
 * Set cached ATP stats data
 * Optimized for free plan: uses minimal storage
 * Silently fails if Redis is unavailable or on any error
 */
export async function setCachedStats(data: unknown) {
  if (!redis) {
    return; // No-op if Redis is not available
  }

  try {
    // Use JSON.stringify with minimal whitespace to save space
    const serialized = JSON.stringify(data);
    await redis.setex(CACHE_KEY, CACHE_TTL, serialized);
  } catch (error) {
    // Log warning but don't throw - gracefully degrade to no caching
    // This handles cases like rate limits, connection errors, etc.
    console.warn("Error writing to cache (continuing without cache):", error);
  }
}

/**
 * Clear the cache (useful for testing or manual invalidation)
 * Silently fails if Redis is unavailable
 */
export async function clearCache() {
  if (!redis) {
    return; // No-op if Redis is not available
  }

  try {
    await redis.del(CACHE_KEY);
  } catch (error) {
    console.warn("Error clearing cache:", error);
  }
}
