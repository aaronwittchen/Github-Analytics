import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubService } from '../github.service.js';
import { GitHubApiService } from '../services/github-api.service.js';
import { GitHubCacheService } from '../services/github-cache.service.js';
import { GitHubTransformService } from '../services/github-transform.service.js';
import { GitHubConfigService } from '../../common/config/github-config.service.js';
import { GitHubValidationError } from '../../common/exceptions/github.exceptions.js';

describe('GitHubService', () => {
  let service: GitHubService;
  let apiService: any;
  let cacheService: any;
  let transformService: any;
  let configService: any;

  beforeEach(async () => {
    apiService = {
      getUser: vi.fn(),
      getUserRepositories: vi.fn(),
      getRepository: vi.fn(),
      getRepositoryReadme: vi.fn(),
      searchRepositories: vi.fn(),
    };

    cacheService = {
      get: vi.fn(),
      set: vi.fn(),
      generateUserStatsKey: vi.fn(),
      generateRepositoryKey: vi.fn(),
      generateReadmeKey: vi.fn(),
    };

    transformService = {
      transformToUserSummaryDto: vi.fn(),
      transformToRepositoryDto: vi.fn(),
      transformToReadmeDto: vi.fn(),
      sortRepositoriesByStars: vi.fn(),
      limitRepositories: vi.fn(),
    };

    configService = {
      maxRepositories: 10,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubService,
        { provide: GitHubApiService, useValue: apiService },
        { provide: GitHubCacheService, useValue: cacheService },
        { provide: GitHubTransformService, useValue: transformService },
        { provide: GitHubConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<GitHubService>(GitHubService);

    // Ensure the service uses our mocked dependencies
    (service as any).apiService = apiService;
    (service as any).cacheService = cacheService;
    (service as any).transformService = transformService;
    (service as any).config = configService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserStats', () => {
    it('should return cached data when available', async () => {
      const cachedData = { username: 'testuser', cached: true };
      cacheService.get.mockResolvedValue(cachedData);
      cacheService.generateUserStatsKey.mockReturnValue('user_stats:testuser');

      const result = await service.getUserStats('testuser');

      expect(result).toEqual({
        ...cachedData,
        cached: true,
        responseTime: expect.any(Number),
      });
      expect(apiService.getUser).not.toHaveBeenCalled();
    });

    it('should fetch from API when not cached', async () => {
      const user = { login: 'testuser', name: 'Test User' };
      const repos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'testuser/repo1',
          stargazers_count: 100,
          language: 'TypeScript',
          description: 'Test repo',
          forks_count: 10,
          open_issues_count: 2,
          private: false,
          html_url: 'https://github.com/testuser/repo1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          owner: {
            login: 'testuser',
            id: 1,
            avatar_url: '',
            name: null,
            email: null,
          },
        },
      ];
      const topRepos = [
        {
          name: 'repo1',
          description: 'Test repo',
          language: 'TypeScript',
          stars: 100,
          forks: 10,
          openIssues: 2,
          isPrivate: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          htmlUrl: 'https://github.com/testuser/repo1',
          lastCommitDate: '2023-01-01T00:00:00Z',
        },
      ];
      const userStats = { username: 'testuser', topRepositories: topRepos };

      cacheService.get.mockResolvedValue(null);
      cacheService.generateUserStatsKey.mockReturnValue('user_stats:testuser');
      apiService.getUser.mockResolvedValue(user);
      apiService.getUserRepositories.mockResolvedValue(repos);
      transformService.sortRepositoriesByStars.mockReturnValue(repos);
      transformService.limitRepositories.mockReturnValue(repos);
      transformService.transformToRepositoryDto.mockReturnValue(topRepos[0]);
      transformService.transformToUserSummaryDto.mockReturnValue(userStats);

      const result = await service.getUserStats('testuser');

      expect(result).toEqual({
        ...userStats,
        cached: false,
        responseTime: expect.any(Number),
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'user_stats:testuser',
        userStats,
      );
    });

    it('should validate username input', async () => {
      await expect(service.getUserStats('')).rejects.toThrow(
        GitHubValidationError,
      );
      await expect(service.getUserStats('   ')).rejects.toThrow(
        GitHubValidationError,
      );
    });
  });

  describe('getRepository', () => {
    it('should return cached repository when available', async () => {
      const cachedRepo = { name: 'test-repo', stars: 100 };
      cacheService.get.mockResolvedValue(cachedRepo);
      cacheService.generateRepositoryKey.mockReturnValue('repo:owner:repo');

      const result = await service.getRepository('owner', 'repo');

      expect(result).toEqual(cachedRepo);
      expect(apiService.getRepository).not.toHaveBeenCalled();
    });

    it('should validate repository inputs', async () => {
      await expect(service.getRepository('', 'repo')).rejects.toThrow(
        GitHubValidationError,
      );
      await expect(service.getRepository('owner', '')).rejects.toThrow(
        GitHubValidationError,
      );
    });
  });
});
