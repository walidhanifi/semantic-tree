type CacheEntry = {
  html: string;
  expiresAt: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const responseCache = new Map<string, CacheEntry>();
const rateLimitStore = new Map<string, RateLimitEntry>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCacheTtlMs(): number {
  return parsePositiveInt(process.env.CACHE_TTL_MS, 60_000);
}

function getRateLimitWindowMs(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
}

function getRateLimitMax(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_MAX, 30);
}

export function getCachedHTML(key: string, now = Date.now()): string | undefined {
  const entry = responseCache.get(key);

  if (!entry) return;
  if (entry.expiresAt <= now) {
    responseCache.delete(key);
    return;
  }

  return entry.html;
}

export function setCachedHTML(
  key: string,
  html: string,
  now = Date.now(),
): void {
  responseCache.set(key, {
    html,
    expiresAt: now + getCacheTtlMs(),
  });
}

export function takeRateLimitSlot(
  key: string,
  now = Date.now(),
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const windowMs = getRateLimitWindowMs();
  const max = getRateLimitMax();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(max - 1, 0),
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(max - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function clearResponseCache(): void {
  responseCache.clear();
}

export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
