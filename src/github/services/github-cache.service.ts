import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { GitHubConfigService } from '../../common/config/github-config.service.js';

@Injectable()
export class GitHubCacheService {
  private readonly logger = new Logger(GitHubCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly config: GitHubConfigService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`[CACHE] HIT for ${key}`);
        return value;
      }
      this.logger.debug(`[CACHE] MISS for ${key}`);
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[CACHE] Error getting from cache: ${errorMessage}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlMs = ttl || this.config.cacheTimeout;
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`[CACHE] Set cache for ${key} with TTL: ${ttlMs}ms`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[CACHE] Error setting cache: ${errorMessage}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`[CACHE] Deleted cache for ${key}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[CACHE] Error deleting cache: ${errorMessage}`);
    }
  }

  generateUserStatsKey(username: string): string {
    return `user_stats:${username}`;
  }

  generateRepositoryKey(owner: string, repo: string): string {
    return `repo:${owner}:${repo}`;
  }

  generateReadmeKey(owner: string, repo: string): string {
    return `readme:${owner}:${repo}`;
  }
}
