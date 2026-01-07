interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60 * 1000;

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getStats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();
    
    const values = Array.from(this.cache.values());
    for (const entry of values) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return { total: this.cache.size, valid, expired };
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

setInterval(() => {
  queryCache.cleanup();
}, 5 * 60 * 1000);

export const CACHE_KEYS = {
  DASHBOARD_STATS: "dashboard:stats",
  ALL_COURSES: "courses:all",
  COURSE: (id: number) => `course:${id}`,
  ALL_SKILLS: "skills:all",
  PLATFORM_SETTINGS: "platform:settings",
  CREDIT_POLICIES: "credit:policies",
} as const;

export const CACHE_TTL = {
  SHORT: 30 * 1000,
  MEDIUM: 2 * 60 * 1000,
  LONG: 10 * 60 * 1000,
  VERY_LONG: 30 * 60 * 1000,
} as const;
