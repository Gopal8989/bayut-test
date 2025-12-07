import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit: ${key}`, {
          context: 'CacheService',
        });
      } else {
        this.logger.debug(`Cache miss: ${key}`, {
          context: 'CacheService',
        });
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error.stack, {
        context: 'CacheService',
      });
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set: ${key}`, {
        context: 'CacheService',
        ttl,
      });
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error.stack, {
        context: 'CacheService',
      });
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete: ${key}`, {
        context: 'CacheService',
      });
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error.stack, {
        context: 'CacheService',
      });
    }
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    try {
      // Clear all keys by iterating (cache-manager doesn't have reset in v5)
      // In production, use Redis store which supports reset
      this.logger.info('Cache reset requested (not fully supported in memory store)', {
        context: 'CacheService',
      });
    } catch (error) {
      this.logger.error('Cache reset error', error.stack, {
        context: 'CacheService',
      });
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // This would require Redis or custom implementation
    this.logger.warn(`Pattern invalidation not fully implemented: ${pattern}`, {
      context: 'CacheService',
    });
  }
}

