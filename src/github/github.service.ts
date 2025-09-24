import { Injectable, Logger } from '@nestjs/common';
import { UserSummaryDto } from './dto/user-summary.dto.js';
import { ReadmeDto } from './dto/readme.dto.js';
import { RepositoryDto } from './dto/repository.dto.js';
import { GitHubRepository } from './interfaces/github.interfaces.js';
import { GitHubApiService } from './services/github-api.service.js';
import { GitHubCacheService } from './services/github-cache.service.js';
import { GitHubTransformService } from './services/github-transform.service.js';
import { GitHubConfigService } from '../common/config/github-config.service.js';
import { GitHubValidators } from '../common/validators/github.validators.js';
import { DEFAULTS } from '../common/constants/defaults.js';

const COUNTRY_ALIASES: Record<string, string[]> = {
  'united states': ['united states', 'america', 'u.s.a.', 'u.s.'],
  'india': ['india', 'bharat', 'भारत'],
  'japan': ['japan', '日本', 'nippon'],
  'germany': ['germany', 'deutschland'],
  'france': ['france', 'français'],
  'china': ['china', '中国', 'zhongguo'],
  // Add more as needed
};

interface UserSummaryResponse extends UserSummaryDto {
  cached: boolean;
  responseTime: number;
}

interface RepositoryResponse extends RepositoryDto {
  cached?: boolean;
}

interface ReadmeResponse extends ReadmeDto {
  cached?: boolean;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private readonly apiService: GitHubApiService,
    private readonly cacheService: GitHubCacheService,
    private readonly transformService: GitHubTransformService,
    private readonly config: GitHubConfigService,
  ) {}

  async getUserStats(username: string, limit?: number): Promise<UserSummaryResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedUsername = GitHubValidators.validateUsername(username);
      // Resolve desired max repo count from request or config
      const requestedLimit = typeof limit === 'number' && isFinite(limit) && limit > 0 ? Math.floor(limit) : undefined;
      const maxReposCfg = requestedLimit ?? (this.config?.config?.maxRepositories || 10);
      const cacheKey = this.cacheService.generateUserStatsKey(validatedUsername, maxReposCfg);

      // Try to get from cache first
      const cached = await this.cacheService.get<UserSummaryDto>(cacheKey);
      if (cached) {
        const endTime = Date.now();
        this.logger.debug(
          `[CACHE] Served user stats from cache in ${endTime - startTime}ms`,
        );
        return {
          ...cached,
          cached: true,
          responseTime: endTime - startTime,
        };
      }

      // Fetch from API
      const user = await this.apiService.getUser(validatedUsername);
      const repos = await this.apiService.getUserRepositories(validatedUsername);

      // Transform and sort repositories
      const sortedRepos = this.transformService.sortRepositoriesByStars(repos);
      const maxRepos = maxReposCfg; // already resolved above
      const limitedRepos = this.transformService.limitRepositories(
        sortedRepos,
        maxRepos,
      );
      const topRepositories = limitedRepos.map((repo) =>
        this.transformService.transformToRepositoryDto(repo),
      );

      // Transform user data
      const userStats = this.transformService.transformToUserSummaryDto(
        user,
        topRepositories,
      );

      // Cache the result
      await this.cacheService.set(cacheKey, userStats);

      const endTime = Date.now();
      this.logger.debug(
        `[API] Fetched user stats from GitHub API in ${endTime - startTime}ms`,
      );

      return {
        ...userStats,
        cached: false,
        responseTime: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(`Failed to get user stats for ${username}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: endTime - startTime,
      });
      throw error;
    }
  }

  async getRepository(
    owner: string,
    repo: string,
  ): Promise<RepositoryResponse> {
    try {
      // Validate inputs first
      const validatedOwner = GitHubValidators.validateOwner(owner);
      const validatedRepo = GitHubValidators.validateRepositoryName(repo);
      
      const cacheKey = this.cacheService.generateRepositoryKey(validatedOwner, validatedRepo);

      // Try to get from cache first
      const cached = await this.cacheService.get<RepositoryDto>(cacheKey);
      if (cached) {
        this.logger.debug(`[CACHE] HIT for repository ${cacheKey}`);
        return cached;
      }

      // Fetch from API
      const repository = await this.apiService.getRepository(validatedOwner, validatedRepo);
      const repositoryDto = this.transformService.transformToRepositoryDto(repository);

      // Cache the result
      await this.cacheService.set(cacheKey, repositoryDto);

      return repositoryDto; // Don't include cached flag for non-cached responses
    } catch (error) {
      this.logger.error(`Failed to get repository ${owner}/${repo}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getRepositoryReadme(
    owner: string,
    repo: string,
  ): Promise<ReadmeResponse> {
    try {
      // Validate inputs
      const validatedOwner = GitHubValidators.validateOwner(owner);
      const validatedRepo = GitHubValidators.validateRepositoryName(repo);
      const cacheKey = this.cacheService.generateReadmeKey(
        validatedOwner,
        validatedRepo,
      );

      // Try to get from cache first
      const cached = await this.cacheService.get<ReadmeDto>(cacheKey);
      if (cached) {
        this.logger.debug(`[CACHE] HIT for readme ${cacheKey}`);
        return { ...cached, cached: true };
      }

      this.logger.debug(`[CACHE] MISS for readme ${cacheKey}`);

      // Fetch from API and transform
      const data = await this.apiService.getRepositoryReadme(
        validatedOwner,
        validatedRepo,
      );
      const result = this.transformService.transformToReadmeDto(
        data,
        validatedOwner,
        validatedRepo,
      );

      // Store in cache
      await this.cacheService.set(cacheKey, result);

      return { ...result, cached: false };
    } catch (error) {
      this.logger.error(`Failed to get README for ${owner}/${repo}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getUserRepositories(
    username: string,
    options: {
      limit?: number;
      includeCommits?: boolean;
      sortBy?: 'stars' | 'updated' | 'created';
    } = {},
  ): Promise<RepositoryDto[]> {
    try {
      const validatedUsername = GitHubValidators.validateUsername(username);
      const cacheKey =
        this.cacheService.generateUserRepositoriesKey(validatedUsername);

      // Try cache first
      let repos: GitHubRepository[];
      const cached = await this.cacheService.get<GitHubRepository[]>(cacheKey);

      if (cached) {
        this.logger.debug(`[CACHE] HIT for user repositories ${cacheKey}`);
        repos = cached;
      } else {
        this.logger.debug(`[CACHE] MISS for user repositories ${cacheKey}`);
        repos = await this.apiService.getUserRepositories(validatedUsername);
        await this.cacheService.set(cacheKey, repos);
      }

      // Apply sorting
      let sortedRepos = repos;
      switch (options.sortBy) {
        case 'stars':
          sortedRepos = this.transformService.sortRepositoriesByStars(repos);
          break;
        case 'updated':
          sortedRepos = this.transformService.sortRepositoriesByUpdated(repos);
          break;
        case 'created':
          sortedRepos = [...repos].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          break;
      }

      // Apply limit
      if (options.limit) {
        sortedRepos = this.transformService.limitRepositories(
          sortedRepos,
          options.limit,
        );
      }

      // Transform repositories
      if (options.includeCommits) {
        // Get latest commits for all repositories
        const repoIdentifiers = sortedRepos
          .map((repo) => {
            const ownerAndName =
              this.transformService.extractOwnerAndRepo(repo);
            return ownerAndName
              ? { owner: ownerAndName.owner, repo: ownerAndName.name }
              : null;
          })
          .filter(
            (repo): repo is { owner: string; repo: string } => repo !== null,
          );

        const commitMap =
          await this.apiService.batchGetLatestCommits(repoIdentifiers);
        return this.transformService.transformRepositoriesToDtos(
          sortedRepos,
          commitMap,
        );
      } else {
        return sortedRepos.map((repo) =>
          this.transformService.transformToRepositoryDto(repo),
        );
      }
    } catch (error) {
      this.logger.error(`Failed to get repositories for user ${username}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getRandomRepository(
    options: {
      minStars?: number;
      maxStars?: number;
      language?: string;
      country?: string;
    } = {},
  ): Promise<RepositoryDto> {
    try {
      const validatedOptions = GitHubValidators.validateStarRange(
        options.minStars,
        options.maxStars,
      );
      let query = 'is:public';
      if (
        validatedOptions.minStars !== undefined &&
        validatedOptions.maxStars !== undefined
      ) {
        query += ` stars:${validatedOptions.minStars}..${validatedOptions.maxStars}`;
      } else if (validatedOptions.minStars !== undefined) {
        query += ` stars:>=${validatedOptions.minStars}`;
      } else if (validatedOptions.maxStars !== undefined) {
        query += ` stars:<=${validatedOptions.maxStars}`;
      } else {
        query += ' stars:>1';
      }
      if (options.language) {
        const normalizedLang = this.normalizeLanguage(options.language);
        if (normalizedLang) {
          const needsQuotes = /[^A-Za-z0-9_-]/.test(normalizedLang);
          const langQualifier = needsQuotes
            ? `"${normalizedLang}"`
            : normalizedLang;
          query += ` language:${langQualifier}`;
        }
      }
      // Try multiple random pages for better country coverage
      const maxTries = 10;
      const maxPages = Math.min(
        this.config.config.randomRepoMaxPages || DEFAULTS.RANDOM_REPO_MAX_PAGES || 50,
        100,
      );
      let filteredRepos: GitHubRepository[] = [];
      let lastError: any = null;
      for (let attempt = 0; attempt < maxTries; attempt++) {
        const randomPage = Math.floor(Math.random() * maxPages) + 1;
        const searchResponse = await this.apiService.searchRepositories(query, {
          page: randomPage,
          perPage: 30,
          sort: 'stars',
        });
        if (!searchResponse.items?.length) {
          lastError = new Error('No repositories found matching the criteria');
          continue;
        }
        filteredRepos = searchResponse.items as GitHubRepository[];
        // Country filter logic
        if (options.country) {
          const countryLower = options.country.trim().toLowerCase();
          const aliases = COUNTRY_ALIASES[countryLower] || [countryLower];
          const limit = 5;
          const reposWithOwners: GitHubRepository[] = [];
          let i = 0;
          while (i < filteredRepos.length) {
            const batch = filteredRepos.slice(i, i + limit);
            const ownerProfiles = await Promise.all(
              batch.map(async (repo) => {
                try {
                  const user = await this.apiService.getUser(repo.owner.login);
                  return { repo, location: user.location };
                } catch {
                  return { repo, location: undefined };
                }
              })
            );
            for (const { repo, location } of ownerProfiles) {
              if (
                location &&
                aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(location))
              ) {
                reposWithOwners.push(repo);
              }
            }
            i += limit;
          }
          filteredRepos = reposWithOwners;
        }
        if (filteredRepos.length) break;
      }
      let selectedRepo: GitHubRepository | undefined;
      let selectedOwnerLocation: string | null = null;
      if (filteredRepos.length) {
        const randomIndex = Math.floor(Math.random() * filteredRepos.length);
        selectedRepo = filteredRepos[randomIndex];
        // Fetch owner's location for the selected repo
        try {
          const user = await this.apiService.getUser(selectedRepo.owner.login);
          selectedOwnerLocation = user.location || null;
        } catch {
          selectedOwnerLocation = null;
        }
      }
      if (!selectedRepo) {
        throw lastError || new Error('No repositories found for the specified country.');
      }
      const baseDto = this.transformService.transformToRepositoryDto(selectedRepo);
      // Attach ownerLocation
      (baseDto as any).ownerLocation = selectedOwnerLocation;
      try {
        const langBytes = await this.apiService.getRepositoryLanguages(
          selectedRepo.owner?.login || '',
          selectedRepo.name,
        );
        return this.transformService.attachLanguagePercentages(baseDto, langBytes);
      } catch (e) {
        return baseDto;
      }
    } catch (error) {
      this.logger.error('Failed to get random repository:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
      });
      throw error;
    }
  }

  private normalizeLanguage(input: string | undefined | null): string | null {
    if (!input) return null;
    const v = String(input).trim();
    if (!v) return null;
    const lower = v.toLowerCase();
    const aliasMap: Record<string, string> = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'py3': 'Python',
      'csharp': 'C#',
      'c#': 'C#',
      'cpp': 'C++',
      'c++': 'C++',
      'objective-c': 'Objective-C',
      'objective c': 'Objective-C',
      'objc': 'Objective-C',
      'vue': 'Vue',
      'vue.js': 'Vue',
      'vuejs': 'Vue',
      'shell': 'Shell',
      'sh': 'Shell',
      'jupyter': 'Jupyter Notebook',
      'jupyter notebook': 'Jupyter Notebook',
      'md': 'Markdown',
      'html': 'HTML',
      'css': 'CSS',
      'go': 'Go',
      'golang': 'Go',
      'rs': 'Rust',
      'rb': 'Ruby',
      'php': 'PHP',
      'kt': 'Kotlin',
      'c': 'C',
      'r': 'R',
      'swift': 'Swift',
      'scala': 'Scala',
      'dart': 'Dart',
      'elixir': 'Elixir',
    };
    // Exact alias match first
    if (aliasMap[lower]) return aliasMap[lower];
    // Title-case common inputs
    const title = v.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
    return title;
  }

  async searchRepositories(
    query: string,
    options: {
      page?: number;
      perPage?: number;
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    } = {},
  ): Promise<{
    repositories: RepositoryDto[];
    totalCount: number;
    currentPage: number;
    hasMore: boolean;
  }> {
    try {
      const { page = 1, perPage = 30, sort = 'stars' } = options;

      // Use cache key for search results
      const cacheKey = this.cacheService.generateSearchKey(query, page);

      // Try cache first
      const cached = await this.cacheService.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(`[CACHE] HIT for search ${cacheKey}`);
        return cached;
      }

      const searchResponse = await this.apiService.searchRepositories(query, {
        page,
        perPage,
        sort,
      });

      const repositories = searchResponse.items.map((repo) =>
        this.transformService.transformToRepositoryDto(
          repo as GitHubRepository,
        ),
      );

      const result = {
        repositories,
        totalCount: searchResponse.total_count,
        currentPage: page,
        hasMore: page * perPage < Math.min(searchResponse.total_count, 1000), // GitHub limits to 1000 results
      };

      // Cache search results for a shorter time
      await this.cacheService.set(cacheKey, result, 300000); // 5 minutes

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to search repositories with query "${query}":`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          options,
        },
      );
      throw error;
    }
  }

  // Cache management methods
  async invalidateUserCache(username: string): Promise<void> {
    try {
      const validatedUsername = GitHubValidators.validateUsername(username);
      await this.cacheService.invalidateUserCache(validatedUsername);
      this.logger.debug(`Invalidated cache for user: ${validatedUsername}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for user ${username}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async warmUserCache(username: string): Promise<void> {
    try {
      const validatedUsername = GitHubValidators.validateUsername(username);

      // Fetch user data and repositories
      const [user, repos] = await Promise.all([
        this.apiService.getUser(validatedUsername),
        this.apiService.getUserRepositories(validatedUsername),
      ]);

      // Transform data
      const sortedRepos = this.transformService.sortRepositoriesByStars(repos);
      const limitedRepos = this.transformService.limitRepositories(
        sortedRepos,
        this.config.config.maxRepositories || 10,
      );
      const topRepositories = limitedRepos.map((repo) =>
        this.transformService.transformToRepositoryDto(repo),
      );
      const userStats = this.transformService.transformToUserSummaryDto(
        user,
        topRepositories,
      );

      // Warm cache
      await this.cacheService.warmUserCache(
        validatedUsername,
        userStats,
        repos,
      );

      this.logger.debug(`Warmed cache for user: ${validatedUsername}`);
    } catch (error) {
      this.logger.error(`Failed to warm cache for user ${username}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
