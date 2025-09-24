import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GitHubConfigService } from '../../common/config/github-config.service.js';
import {
  GitHubApiError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from '../../common/exceptions/github.exceptions.js';
import {
  GitHubRepository,
  GitHubUser,
  GitHubCommit,
  GitHubReadmeResponse,
  GitHubSearchResponse,
  PaginationOptions,
} from '../interfaces/github.interfaces.js';

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);
  private readonly octokit: Octokit;

  constructor(private readonly config: GitHubConfigService) {
    this.octokit = new Octokit({
      auth: this.config.githubToken,
      retry: {
        doNotRetry: ['429'], // Let our custom rate limit handling deal with 429s
      },
    });
  }

  async getUser(username: string): Promise<GitHubUser> {
    try {
      const { data } = await this.octokit.rest.users.getByUsername({
        username,
      });
      return data as GitHubUser;
    } catch (error: any) {
      this.handleApiError(error, `getUser for ${username}`);
    }
  }

  async getUserRepositories(
    username: string,
    options: PaginationOptions = {},
  ): Promise<GitHubRepository[]> {
    const { page = 1, perPage = 50 } = options;

    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: Math.min(perPage, 100), // GitHub API max is 100
        page,
      });
      return data as GitHubRepository[];
    } catch (error: any) {
      this.handleApiError(error, `getUserRepositories for ${username}`);
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
      return data as Record<string, number>;
    } catch (error: any) {
      this.handleApiError(error, `getRepositoryLanguages for ${owner}/${repo}`);
    }
  }

  async getAllUserRepositories(username: string): Promise<GitHubRepository[]> {
    const allRepos: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        const repos = await this.getUserRepositories(username, {
          page,
          perPage,
        });

        if (repos.length === 0) {
          break;
        }

        allRepos.push(...repos);

        // If we got fewer than perPage, we've reached the end
        if (repos.length < perPage) {
          break;
        }

        page++;
      }

      return allRepos;
    } catch (error: any) {
      this.handleApiError(error, `getAllUserRepositories for ${username}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return data as GitHubRepository;
    } catch (error: any) {
      this.handleApiError(error, `getRepository for ${owner}/${repo}`);
    }
  }

  async getRepositoryReadme(
    owner: string,
    repo: string,
  ): Promise<GitHubReadmeResponse> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
      });
      return data as GitHubReadmeResponse;
    } catch (error: any) {
      this.handleApiError(error, `getRepositoryReadme for ${owner}/${repo}`);
    }
  }

  async searchRepositories(
    query: string,
    options: PaginationOptions & {
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    } = {},
  ): Promise<GitHubSearchResponse> {
    const { page = 1, perPage = 30, sort = 'stars' } = options;

    try {
      const { data } = await this.octokit.rest.search.repos({
        q: query,
        sort,
        order: 'desc',
        per_page: Math.min(perPage, 100),
        page,
      });
      return data as GitHubSearchResponse;
    } catch (error: any) {
      this.handleApiError(error, `searchRepositories with query: ${query}`);
    }
  }

  async getRepositoryCommits(
    owner: string,
    repo: string,
    options: PaginationOptions = {},
  ): Promise<GitHubCommit[]> {
    const { page = 1, perPage = 30 } = options;

    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: Math.min(perPage, 100),
        page,
      });
      return data as GitHubCommit[];
    } catch (error: any) {
      this.handleApiError(error, `getRepositoryCommits for ${owner}/${repo}`);
    }
  }

  async getLatestCommit(
    owner: string,
    repo: string,
  ): Promise<GitHubCommit | null> {
    try {
      const commits = await this.getRepositoryCommits(owner, repo, {
        perPage: 1,
      });
      return commits.length > 0 ? commits[0] : null;
    } catch (error: any) {
      this.logger.warn(
        `Failed to get latest commit for ${owner}/${repo}: ${error.message}`,
      );
      return null;
    }
  }

  async batchGetLatestCommits(
    repositories: Array<{ owner: string; repo: string }>,
  ): Promise<Map<string, GitHubCommit | null>> {
    const results = new Map<string, GitHubCommit | null>();

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);

      const promises = batch.map(async ({ owner, repo }) => {
        const key = `${owner}/${repo}`;
        const commit = await this.getLatestCommit(owner, repo);
        results.set(key, commit);
      });

      await Promise.allSettled(promises);

      // Add a small delay
      if (i + batchSize < repositories.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleApiError(error: any, context: string): never {
    const status = error?.status;
    const message = error?.message || 'Unknown API error';
    const response = error?.response || {};
    const headers = response.headers || {};

    this.logger.error(`GitHub API Error in ${context}:`, {
      status,
      message,
      context,
      rateLimitRemaining: headers['x-ratelimit-remaining'],
      rateLimitReset: headers['x-ratelimit-reset'],
    });

    switch (status) {
      case 404:
        throw new GitHubNotFoundError('Resource not found', context);
      case 403:
        // Check if it's a rate limit or access issue
        if (message.includes('rate limit') || message === 'Rate Limited' || headers['x-ratelimit-remaining'] === '0') {
          throw new GitHubRateLimitError(context);
        }
        throw new GitHubApiError('Access forbidden', 403, context, error);
      case 422:
        throw new GitHubApiError(
          'Invalid request to GitHub API',
          422,
          context,
          error,
        );
      case 401:
        throw new GitHubApiError(
          'Authentication required',
          401,
          context,
          error,
        );
      default:
        throw new GitHubApiError(message, status || 500, context, error);
    }
  }
}
