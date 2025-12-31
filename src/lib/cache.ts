/**
 * Cache Manager for Firebase Data
 * Reduces database queries by caching user data in memory and localStorage
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number; // milliseconds
}

class DataCache {
    private memoryCache: Map<string, CacheEntry<any>> = new Map();
    private readonly STORAGE_PREFIX = 'lotofoco_cache_';

    /**
     * Get data from cache (memory first, then localStorage)
     */
    get<T>(key: string): T | null {
        // Check memory cache first (fastest)
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && !this.isExpired(memoryEntry)) {
            console.log(`[Cache HIT - Memory] ${key}`);
            return memoryEntry.data as T;
        }

        // Check localStorage (slower but persists)
        try {
            const storageKey = this.STORAGE_PREFIX + key;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (!this.isExpired(entry)) {
                    console.log(`[Cache HIT - Storage] ${key}`);
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    return entry.data;
                } else {
                    // Expired, remove from storage
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (error) {
            console.error('[Cache] Error reading from storage:', error);
        }

        console.log(`[Cache MISS] ${key}`);
        return null;
    }

    /**
     * Set data in cache (both memory and localStorage)
     */
    set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresIn
        };

        // Store in memory
        this.memoryCache.set(key, entry);

        // Store in localStorage (with error handling)
        try {
            const storageKey = this.STORAGE_PREFIX + key;
            localStorage.setItem(storageKey, JSON.stringify(entry));
            console.log(`[Cache SET] ${key} (expires in ${expiresIn / 1000}s)`);
        } catch (error) {
            console.error('[Cache] Error writing to storage:', error);
        }
    }

    /**
     * Invalidate cache for a specific key
     */
    invalidate(key: string): void {
        this.memoryCache.delete(key);
        try {
            localStorage.removeItem(this.STORAGE_PREFIX + key);
            console.log(`[Cache INVALIDATE] ${key}`);
        } catch (error) {
            console.error('[Cache] Error invalidating:', error);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('[Cache] Cleared all cache');
        } catch (error) {
            console.error('[Cache] Error clearing:', error);
        }
    }

    /**
     * Check if cache entry is expired
     */
    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > entry.expiresIn;
    }
}

// Singleton instance
export const dataCache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
    USER_BETS: (userId: string) => `user_bets_${userId}`,
    USER_STATS: (userId: string) => `user_stats_${userId}`,
    USER_PROFILE: (userId: string) => `user_profile_${userId}`,
    HISTORICAL_RESULTS: (gameSlug: string) => `historical_${gameSlug}`
};

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
    SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
    MEDIUM: 5 * 60 * 1000,     // 5 minutes - for user bets and stats
    LONG: 30 * 60 * 1000,      // 30 minutes - for historical results
    VERY_LONG: 24 * 60 * 60 * 1000  // 24 hours - for static data
};
