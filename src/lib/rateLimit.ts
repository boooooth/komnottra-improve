/**
 * In-memory sliding-window rate limiter for Komnottra API routes.
 * Mitigates Denial-of-Service and excessive automated scanning/submission.
 */

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60,000 ms / 1 minute)
  maxRequests?: number; // Max requests allowed per window (default: 30)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// In-memory request timestamp store: identifier -> array of request timestamps (epoch ms)
const rateLimitStore = new Map<string, number[]>();

// Cleanup expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const active = timestamps.filter((t) => now - t < 10 * 60 * 1000);
      if (active.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, active);
      }
    }
  }, 5 * 60 * 1000);

  // Allow Node.js process to exit cleanly if this is the only active timer
  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

/**
 * Checks whether an action from a given identifier (IP or user ID) is permitted.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60 * 1000;
  const maxRequests = options.maxRequests ?? 30;

  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = rateLimitStore.get(identifier) || [];
  const activeTimestamps = timestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= maxRequests) {
    const oldest = activeTimestamps[0];
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(identifier, activeTimestamps);

  return {
    allowed: true,
    remaining: maxRequests - activeTimestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Resolves the client's public IP address from standard reverse-proxy headers.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
