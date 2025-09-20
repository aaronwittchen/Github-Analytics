import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GitHubServiceConfig } from './types/github.types.js';
import {
  GitHubRepository,
  LanguageStat,
  LastCommit,
  RepositoryDto,
} from './interfaces/github.interfaces.js';
import { UserSummaryDto } from './dto/user-summary.dto.js';

@Injectable()
export class GitHubService {
  private readonly octokit: Octokit;
  private readonly config: GitHubServiceConfig;

  constructor() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.config = {
      maxRepositories: 10,
      languageStatsLimit: 10,
      randomRepoMaxPages: 33,
      cacheTimeout: 300,
    };
  }

  async getUserStats(username: string): Promise<UserSummaryDto> {
    try {
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username: this.sanitizeUsername(username),
      });

      const { data: repos } = await this.octokit.rest.repos.listForUser({
        username: this.sanitizeUsername(username),
        sort: 'updated',
        per_page: 50,
      });

      // Directly map and sort repositories without intermediate conversion
      const topRepositories = repos
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, this.config.maxRepositories)
        .map((repo) => ({
          name: repo.name,
          description: repo.description || null,
          language: repo.language || null,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          openIssues: repo.open_issues_count || 0,
          isPrivate: repo.private || false,
          createdAt: repo.created_at || '',
          updatedAt: repo.updated_at || '',
          htmlUrl: repo.html_url || '',
          githubUrl: repo.html_url || '',
        }));

      // Return UserSummaryDto format
      return {
        username: user.login,
        name: user.name,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        avatarUrl: user.avatar_url || '',
        githubUrl: user.html_url || '',
        followers: user.followers || 0,
        following: user.following || 0,
        publicRepos: user.public_repos || 0,
        publicGists: user.public_gists || 0,
        createdAt: user.created_at || '',
        updatedAt: user.updated_at || '',
        topRepositories,
        owner: user.login,
        ownerAvatarUrl: user.avatar_url || '',
      };
    } catch (error: unknown) {
      this.handleGitHubError(error, `getUserStats for ${username}`);
    }
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<any> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner: this.sanitizeUsername(owner),
        repo: this.sanitizeRepoName(repo),
        mediaType: {
          format: 'raw+json',
        },
      });
      return data;
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException('README not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  async getRandomRepository(options?: {
    minStars?: number;
    maxStars?: number;
  }): Promise<RepositoryDto> {
    try {
      // Build the query based on star range
      let query = 'is:public';

      if (options?.minStars !== undefined && options?.maxStars !== undefined) {
        query += ` stars:${options.minStars}..${options.maxStars}`;
      } else if (options?.minStars !== undefined) {
        query += ` stars:>=${options.minStars}`;
      } else if (options?.maxStars !== undefined) {
        query += ` stars:<=${options.maxStars}`;
      } else {
        // Default to repositories with at least 10 stars if no range is provided
        query += ' stars:>10';
      }

      // For very small ranges, we need to adjust the random page calculation
      const maxPages =
        options?.minStars && options?.minStars > 1000
          ? 10
          : this.config.randomRepoMaxPages;
      const randomPage = Math.floor(Math.random() * maxPages) + 1;

      const { data } = await this.octokit.rest.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 30,
        page: randomPage,
      });

      if (!data.items?.length) {
        throw new Error('No repositories found matching the criteria');
      }

      // Select a random repository from the current page
      const repo = data.items[Math.floor(Math.random() * data.items.length)];
      return this.mapToRepositoryDto(repo as GitHubRepository);
    } catch (error: unknown) {
      this.handleGitHubError(error, 'getRandomRepository');
    }
  }

  private async getLanguageStats(
    username: string,
    repos: GitHubRepository[],
  ): Promise<LanguageStat[]> {
    const languageMap = new Map<string, number>();

    await Promise.all(
      repos.slice(0, this.config.languageStatsLimit).map(async (repo) => {
        try {
          const { data: langs } = await this.octokit.rest.repos.listLanguages({
            owner: username,
            repo: repo.name,
          });

          for (const [lang, count] of Object.entries(langs)) {
            languageMap.set(
              lang,
              (languageMap.get(lang) || 0) + (count as number),
            );
          }
        } catch {
          // ignore individual repo errors
        }
      }),
    );

    const total = Array.from(languageMap.values()).reduce(
      (sum, v) => sum + v,
      0,
    );

    return Array.from(languageMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10);
  }

  private async getLastCommit(
    username: string,
    repos: GitHubRepository[],
  ): Promise<LastCommit | undefined> {
    const repo = repos[0];
    if (!repo?.name) return undefined;

    try {
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner: username,
        repo: repo.name,
        per_page: 1,
      });
      const commit = commits[0];
      if (!commit) return undefined;

      return {
        sha: commit.sha,
        message: commit.commit?.message?.split('\n')[0],
        date: commit.commit?.committer?.date || commit.commit?.author?.date,
        url: commit.html_url,
      };
    } catch {
      return undefined;
    }
  }

  private async mapToRepositoryDto(repo: GitHubRepository): Promise<RepositoryDto> {
    let lastCommitDate: string | undefined;
    let languages: Array<{ name: string; percentage: number }> = [];
    
    try {
      // Extract owner and repo name from the repository URL
      const urlParts = repo.html_url?.split('/');
      const owner = urlParts?.[3];
      const repoName = urlParts?.[4];
      
      if (owner && repoName) {
        // Get the last commit for the repository
        const [commitsResponse, languagesResponse] = await Promise.all([
          this.octokit.rest.repos.listCommits({
            owner,
            repo: repoName,
            per_page: 1,
          }),
          this.octokit.rest.repos.listLanguages({
            owner,
            repo: repoName,
          }),
        ]);

        // Process commits for last commit date
        if (commitsResponse.data?.[0]?.commit) {
          const commit = commitsResponse.data[0].commit;
          lastCommitDate = commit.committer?.date || 
            commit.author?.date || 
            repo.pushed_at || 
            repo.updated_at || 
            repo.created_at ||
            new Date().toISOString();
        } else {
          lastCommitDate = repo.pushed_at || repo.updated_at || repo.created_at || new Date().toISOString();
        }

        // Process languages
        const languageData = languagesResponse.data as Record<string, number>;
        const totalBytes = Object.values(languageData).reduce(
          (sum, bytes) => sum + bytes, 
          0
        );
        
        if (totalBytes > 0) {
          languages = Object.entries(languageData)
            .map(([name, bytes]) => ({
              name,
              percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.percentage - a.percentage);
        }
      } else {
        lastCommitDate = repo.pushed_at || repo.updated_at || repo.created_at || new Date().toISOString();
      }
    } catch (error) {
      console.error('Error fetching repository data:', error);
      lastCommitDate = repo.pushed_at || repo.updated_at || repo.created_at || new Date().toISOString();
    }
    
    return {
      name: repo.name,
      description: repo.description,
      language: repo.language,
      languages: languages.length > 0 ? languages : undefined,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      isPrivate: repo.private || false,
      createdAt: repo.created_at || '',
      updatedAt: repo.updated_at || '',
      htmlUrl: repo.html_url || '',
      githubUrl: repo.html_url || '',
      lastCommitDate,
    };
  }

  private sanitizeUsername(username: string): string {
    // Remove any leading/trailing whitespace and @ symbols
    return username.trim().replace(/^@/, '');
  }

  private sanitizeRepoName(repo: string): string {
    // Remove any leading/trailing whitespace and .git suffix
    return repo.trim().replace(/\.git$/, '');
  }

  private handleGitHubError(error: unknown, context?: string): never {
    const status = (error as { status?: number }).status;
    const message = error instanceof Error ? error.message : 'Unknown error';

    console.error(`GitHub Error${context ? ` (${context})` : ''}:`, message);

    if (status === 404)
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    if (status === 403)
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
