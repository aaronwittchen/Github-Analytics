import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubApiService } from '../github-api.service.js';
import { GitHubConfigService } from '../../../common/config/github-config.service.js';
import { GitHubNotFoundError, GitHubRateLimitError } from '../../../common/exceptions/github.exceptions.js';

const mockOctokit = {
  rest: {
    users: { getByUsername: vi.fn() },
    repos: {
      listForUser: vi.fn(),
      get: vi.fn(),
      getReadme: vi.fn(),
      listCommits: vi.fn(),
    },
    search: { repos: vi.fn() },
  },
};

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokit),
}));

describe('GitHubApiService', () => {
  let service: GitHubApiService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      githubToken: 'test-token',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GitHubApiService,
          useFactory: () => {
            const service = new GitHubApiService(configService);
            return service;
          },
        },
        { provide: GitHubConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<GitHubApiService>(GitHubApiService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user data successfully', async () => {
      const mockUser = { login: 'testuser', name: 'Test User' };
      mockOctokit.rest.users.getByUsername.mockResolvedValue({ data: mockUser });

      const result = await service.getUser('testuser');

      expect(result).toEqual(mockUser);
      expect(mockOctokit.rest.users.getByUsername).toHaveBeenCalledWith({
        username: 'testuser',
      });
    });

    it('should throw GitHubNotFoundError for 404', async () => {
      const error = { status: 404, message: 'Not Found' };
      mockOctokit.rest.users.getByUsername.mockRejectedValue(error);

      await expect(service.getUser('nonexistent')).rejects.toThrow(GitHubNotFoundError);
    });

    it('should throw GitHubRateLimitError for 403', async () => {
      const error = { status: 403, message: 'Rate Limited' };
      mockOctokit.rest.users.getByUsername.mockRejectedValue(error);

      await expect(service.getUser('testuser')).rejects.toThrow(GitHubRateLimitError);
    });
  });

  describe('getRepository', () => {
    it('should return repository data successfully', async () => {
      const mockRepo = { name: 'test-repo', stargazers_count: 100 };
      mockOctokit.rest.repos.get.mockResolvedValue({ data: mockRepo });

      const result = await service.getRepository('owner', 'repo');

      expect(result).toEqual(mockRepo);
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
      });
    });
  });
});
