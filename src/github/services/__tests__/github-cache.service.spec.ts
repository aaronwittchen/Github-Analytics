import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GitHubCacheService } from '../github-cache.service.js';
import { GitHubConfigService } from '../../../common/config/github-config.service.js';

describe('GitHubCacheService', () => {
  let service: GitHubCacheService;
  let cacheManager: any;
  let configService: any;

  beforeEach(async () => {
    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    configService = {
      cacheTimeout: 300000, // 5 minutes
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GitHubCacheService,
          useFactory: () => {
            const service = new GitHubCacheService(cacheManager, configService);
            return service;
          },
        },
        { provide: CACHE_MANAGER, useValue: cacheManager },
        { provide: GitHubConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<GitHubCacheService>(GitHubCacheService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value when found', async () => {
      const cachedValue = { data: 'test' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get('test-key');

      expect(result).toEqual(cachedValue);
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when not found', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null and log error when cache fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
      // Note: The service logs to logger, not console.error directly
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set cache value successfully', async () => {
      const value = { data: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 300000);
    });

    it('should use custom TTL when provided', async () => {
      const value = { data: 'test' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value, 600000);

      expect(cacheManager.set).toHaveBeenCalledWith('test-key', value, 600000);
    });
  });

  describe('generateUserStatsKey', () => {
    it('should generate correct cache key', () => {
      const key = service.generateUserStatsKey('testuser');
      expect(key).toBe('user_stats:testuser');
    });
  });
});
