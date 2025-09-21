import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GitHubConfigService } from '../../common/config/github-config.service.js';
import { GitHubApiError, GitHubNotFoundError, GitHubRateLimitError } from '../../common/exceptions/github.exceptions.js';
import { GitHubRepository } from '../interfaces/github.interfaces.js';

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);
  private readonly octokit: Octokit;

  constructor(private readonly config: GitHubConfigService) {
    this.octokit = new Octokit({
      auth: this.config.githubToken,
    });
  }

  async getUser(username: string): Promise<any> {
    try {
      const { data } = await this.octokit.rest.users.getByUsername({
        username,
      });
      return data;
    } catch (error: any) {
      this.handleApiError(error, `getUser for ${username}`);
    }
  }

  async getUserRepositories(username: string): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 50,
      });
      return data as GitHubRepository[];
    } catch (error: any) {
      this.handleApiError(error, `getUserRepositories for ${username}`);
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

  async getRepositoryReadme(owner: string, repo: string): Promise<any> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
      });
      return data;
    } catch (error: any) {
      this.handleApiError(error, `getRepositoryReadme for ${owner}/${repo}`);
    }
  }

  async searchRepositories(query: string, page: number = 1): Promise<any> {
    try {
      const { data } = await this.octokit.rest.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 30,
        page,
      });
      return data;
    } catch (error: any) {
      this.handleApiError(error, `searchRepositories with query: ${query}`);
    }
  }

  async getRepositoryCommits(owner: string, repo: string, perPage: number = 1): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: perPage,
      });
      return data;
    } catch (error: any) {
      this.handleApiError(error, `getRepositoryCommits for ${owner}/${repo}`);
    }
  }

  private handleApiError(error: any, context: string): never {
    const status = error?.status;
    const message = error?.message || 'Unknown API error';

    this.logger.error(`GitHub API Error in ${context}:`, {
      status,
      message,
      context,
    });

    switch (status) {
      case 404:
        throw new GitHubNotFoundError('Resource', context);
      case 403:
        throw new GitHubRateLimitError(context);
      case 422:
        throw new GitHubApiError('Invalid request to GitHub API', 422, context, error);
      default:
        throw new GitHubApiError(message, 500, context, error);
    }
  }
}
