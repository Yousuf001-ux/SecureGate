import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client using standard environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Configure sliding window: 5 requests maximum per 10-minute window
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false,
  prefix: "@upstash/ratelimit/securegate",
});

/**
 * Enforces rate limiting on a specific action per client IP.
 * Returns true if the attempt is allowed, false if blocked (exceeded limit).
 */
export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  // If Upstash credentials are not set (local development environment with placeholders),
  // warn on the server console and bypass to allow dev testing.
  const isUrlConfigured = process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("placeholder");
  const isTokenConfigured = process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.UPSTASH_REDIS_REST_TOKEN.includes("placeholder");

  if (!isUrlConfigured || !isTokenConfigured) {
    console.warn(
      `[RateLimit] Upstash Redis credentials not configured. Bypassing rate limiting checks for IP: ${ip}, Action: ${action}`
    );
    return true;
  }

  try {
    const identifier = `${action}:${ip}`;
    const { success } = await rateLimiter.limit(identifier);
    return success;
  } catch (error) {
    // If Redis goes down or there is a connection network error, we log it server-side.
    // In a strict security system we default to fail-closed, but during migrations/deployments,
    // we default to true to prevent complete service denial, or false to preserve strictness.
    // Let's log and return true to prevent outages while logging the critical error.
    console.error(`[RateLimit] Redis error while checking IP: ${ip}, Action: ${action}. Permitting access to avoid outage.`, error);
    return true;
  }
}
