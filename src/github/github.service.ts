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

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private readonly apiService: GitHubApiService,
    private readonly cacheService: GitHubCacheService,
    private readonly transformService: GitHubTransformService,
    private readonly config: GitHubConfigService,
  ) {}

  // Main service methods - orchestration layer

  async getUserStats(username: string): Promise<UserSummaryDto> {
    const startTime = Date.now();
    
    // Validate input
    const validatedUsername = GitHubValidators.validateUsername(username);
    const cacheKey = this.cacheService.generateUserStatsKey(validatedUsername);

    // Try to get from cache first
    const cached = await this.cacheService.get<UserSummaryDto>(cacheKey);
    if (cached) {
      const endTime = Date.now();
      this.logger.debug(`[CACHE] Served from cache in ${endTime - startTime}ms`);
      return { ...cached, cached: true, responseTime: endTime - startTime };
    }

    // Fetch from API
    const user = await this.apiService.getUser(validatedUsername);
    const repos = await this.apiService.getUserRepositories(validatedUsername);

    // Transform and sort repositories
    const sortedRepos = this.transformService.sortRepositoriesByStars(repos);
    const limitedRepos = this.transformService.limitRepositories(sortedRepos, this.config.maxRepositories);
    const topRepositories = limitedRepos.map(repo => this.transformService.transformToRepositoryDto(repo));

    // Transform user data
    const userStats = this.transformService.transformToUserSummaryDto(user, topRepositories);

    // Cache the result
    await this.cacheService.set(cacheKey, userStats);

    const endTime = Date.now();
    this.logger.debug(`[API] Fetched from GitHub API in ${endTime - startTime}ms`);

    return {
      ...userStats,
      cached: false,
      responseTime: endTime - startTime,
    };
  }

  async getRepository(owner: string, repo: string): Promise<RepositoryDto> {
    // Validate inputs
    const validatedOwner = GitHubValidators.validateOwner(owner);
    const validatedRepo = GitHubValidators.validateRepositoryName(repo);
    const cacheKey = this.cacheService.generateRepositoryKey(validatedOwner, validatedRepo);

    // Try to get from cache first
    const cached = await this.cacheService.get<RepositoryDto>(cacheKey);
    if (cached) {
      this.logger.debug(`[CACHE] HIT for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`[CACHE] MISS for ${cacheKey}`);

    // Fetch from API and transform
    const repoData = await this.apiService.getRepository(validatedOwner, validatedRepo);
    const result = await this.transformService.transformToRepositoryDtoWithLastCommit(repoData);

    // Cache the result
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<ReadmeDto> {
    // Validate inputs
    const validatedOwner = GitHubValidators.validateOwner(owner);
    const validatedRepo = GitHubValidators.validateRepositoryName(repo);
    const cacheKey = this.cacheService.generateReadmeKey(validatedOwner, validatedRepo);

    // Try to get from cache first
    const cached = await this.cacheService.get<ReadmeDto>(cacheKey);
    if (cached) {
      this.logger.debug(`[CACHE] HIT for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`[CACHE] MISS for ${cacheKey}`);

    // Fetch from API and transform
    const data = await this.apiService.getRepositoryReadme(validatedOwner, validatedRepo);
    const result = this.transformService.transformToReadmeDto(data, validatedOwner, validatedRepo);

    // Store in cache
    await this.cacheService.set(cacheKey, result);

    return result;
  }

  async getRandomRepository(
    options: { minStars?: number; maxStars?: number } = {},
  ): Promise<RepositoryDto> {
    // Validate star range
    const validatedOptions = GitHubValidators.validateStarRange(options.minStars, options.maxStars);

    // Build the query based on star range
    let query = 'is:public';

    if (validatedOptions.minStars !== undefined && validatedOptions.maxStars !== undefined) {
      query += ` stars:${validatedOptions.minStars}..${validatedOptions.maxStars}`;
    } else if (validatedOptions.minStars !== undefined) {
      query += ` stars:>=${validatedOptions.minStars}`;
    } else if (validatedOptions.maxStars !== undefined) {
      query += ` stars:<=${validatedOptions.maxStars}`;
    } else {
      // Default to repositories with at least 1 star if no range is provided
      query += ' stars:>1';
    }

    // For very small ranges, we need to adjust the random page calculation
    const maxPages = validatedOptions.minStars && validatedOptions.minStars > 1000
      ? 10
      : this.config.randomRepoMaxPages;
    const randomPage = Math.floor(Math.random() * maxPages) + 1;

    const data = await this.apiService.searchRepositories(query, randomPage);

    if (!data.items?.length) {
      throw new Error('No repositories found matching the criteria');
    }

    // Select a random repository from the current page
    const repo = data.items[Math.floor(Math.random() * data.items.length)];
    return this.transformService.transformToRepositoryDto(repo as GitHubRepository);
  }

}
