import { Injectable, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserSummaryDto } from './dto/user-summary.dto.js';
import { ReadmeDto } from './dto/readme.dto.js';
import { RepositoryDto } from './dto/repository.dto.js';
import { GitHubRepository, LanguageStat, LastCommit } from './interfaces/github.interfaces.js';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly octokit: Octokit;
  private readonly config = {
    maxRepositories: parseInt(process.env.MAX_REPOSITORIES || '10', 10),
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300', 10) * 1000, // Convert to ms
    languageStatsLimit: parseInt(process.env.LANGUAGE_STATS_LIMIT || '10', 10),
    randomRepoMaxPages: parseInt(process.env.RANDOM_REPO_MAX_PAGES || '33', 10),
  };

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
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

  private async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const ttlMs = ttl || this.config.cacheTimeout;
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`[CACHE] Set cache for ${key} with TTL: ${ttlMs}ms`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[CACHE] Error setting cache: ${errorMessage}`);
    }
  }

  async getUserStats(username: string): Promise<UserSummaryDto> {
    const startTime = Date.now();
    const cacheKey = `user_stats:${username}`;
    
    // Try to get from cache first
    const cached = await this.getFromCache<UserSummaryDto>(cacheKey);
    if (cached) {
      const endTime = Date.now();
      this.logger.debug(`[CACHE] Served from cache in ${endTime - startTime}ms`);
      return { ...cached, _cached: true, _responseTime: endTime - startTime };
    }
    
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

      // Prepare the user stats
      const userStats: UserSummaryDto = {
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

      // Cache the result
      await this.setCache(cacheKey, userStats);
      
      const endTime = Date.now();
      this.logger.debug(`[API] Fetched from GitHub API in ${endTime - startTime}ms`);
      
      return { ...userStats, _cached: false, _responseTime: endTime - startTime };
    } catch (error: unknown) {
      this.handleGitHubError(error, `getUserStats for ${username}`);
    }
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<ReadmeDto> {
    const cacheKey = `readme:${owner}:${repo}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get<ReadmeDto>(cacheKey);
    if (cached) {
      console.log(`Cache HIT for ${cacheKey}`);
      return cached;
    }
    
    console.log(`Cache MISS for ${cacheKey}`);
    
    try {
      const sanitizedOwner = this.sanitizeUsername(owner);
      const sanitizedRepo = this.sanitizeRepoName(repo);
      
      const { data } = await this.octokit.rest.repos.getReadme({
        owner: sanitizedOwner,
        repo: sanitizedRepo,
      });
      
      const result = {
        name: data.name || 'README.md',
        path: data.path || `/${sanitizedOwner}/${sanitizedRepo}/README.md`,
        content: data.content || '',
        encoding: data.encoding || 'base64',
        size: data.size || 0,
        htmlUrl:
          data.html_url ||
          `https://github.com/${sanitizedOwner}/${sanitizedRepo}/blob/main/README.md`,
        downloadUrl:
          data.download_url ||
          `https://api.github.com/repos/${sanitizedOwner}/${sanitizedRepo}/readme`,
      };
      
      // Store in cache
      try {
        console.log(`[CACHE] Setting cache for ${cacheKey} with TTL: ${this.config.cacheTimeout} seconds`);
        await this.cacheManager.set(cacheKey, result, this.config.cacheTimeout * 1000);
        console.log(`[CACHE] Successfully cached data for ${cacheKey}`);
        
        // Verify the cache was set
        const verifyCache = await this.cacheManager.get(cacheKey);
        console.log(`[CACHE] Cache verification for ${cacheKey}:`, verifyCache ? 'SUCCESS' : 'FAILED');
      } catch (cacheError) {
        console.error('[CACHE] Error setting cache:', cacheError);
      }
      
      return result;
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 404) {
        throw new HttpException('README not found', HttpStatus.NOT_FOUND);
      }
      this.handleGitHubError(error, `getRepositoryReadme for ${owner}/${repo}`);
    }
  }

  async getRandomRepository(options: { minStars?: number; maxStars?: number } = {}): Promise<RepositoryDto> {
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
        // Default to repositories with at least 1 star if no range is provided
        query += ' stars:>1';
      }

      // For very small ranges, we need to adjust the random page calculation
      const maxPages = options?.minStars && options.minStars > 1000 ? 10 : this.config.randomRepoMaxPages;
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

  private async mapToRepositoryDto(
    repo: GitHubRepository,
  ): Promise<RepositoryDto> {
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
          lastCommitDate =
            commit.committer?.date ||
            commit.author?.date ||
            repo.pushed_at ||
            repo.updated_at ||
            repo.created_at ||
            new Date().toISOString();
        } else {
          lastCommitDate =
            repo.pushed_at ||
            repo.updated_at ||
            repo.created_at ||
            new Date().toISOString();
        }

        // Process languages
        const languageData = languagesResponse.data as Record<string, number>;
        const totalBytes = Object.values(languageData).reduce(
          (sum, bytes) => sum + bytes,
          0,
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
        lastCommitDate =
          repo.pushed_at ||
          repo.updated_at ||
          repo.created_at ||
          new Date().toISOString();
      }
    } catch (error) {
      console.error('Error fetching repository data:', error);
      lastCommitDate =
        repo.pushed_at ||
        repo.updated_at ||
        repo.created_at ||
        new Date().toISOString();
    }

    return {
      name: repo.name,
      description: repo.description,
      language: repo.language,
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

  private parseEnvInt(key: string, defaultValue: number): number {
    const value = process.env[key];
    const parsed = value ? parseInt(value, 10) : defaultValue;
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private sanitizeUsername(username: string): string {
    // Remove any leading/trailing whitespace and @ symbols
    return username.trim().replace(/^@/, '');
  }

  private sanitizeRepoName(repo: string): string {
    // Remove any leading/trailing whitespace and .git suffix
    return repo.trim().replace(/\.git$/, '');
  }

  private handleGitHubError(error: any, context?: string): never {
    const status = error?.status;
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
