import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULTS } from '../constants/defaults.js';

type Config = {
  maxRepositories: number;
  cacheTimeout: number;
  languageStatsLimit: number;
  randomRepoMaxPages: number;
  requestTimeout: number;
};

@Injectable()
export class GitHubConfigService {
  readonly config: Readonly<Config>;

  constructor(private readonly configService: ConfigService) {
    const internalConfig = {
      MAX_REPOSITORIES: this.getRequiredNumber(
        'MAX_REPOSITORIES',
        DEFAULTS.MAX_REPOSITORIES,
      ),
      CACHE_TIMEOUT_MS: this.getRequiredNumber(
        'CACHE_TIMEOUT_MS',
        DEFAULTS.CACHE_TIMEOUT_MS,
      ),
      LANGUAGE_STATS_LIMIT: this.getRequiredNumber(
        'LANGUAGE_STATS_LIMIT',
        DEFAULTS.LANGUAGE_STATS_LIMIT,
      ),
      RANDOM_REPO_MAX_PAGES: this.getRequiredNumber(
        'RANDOM_REPO_MAX_PAGES',
        DEFAULTS.RANDOM_REPO_MAX_PAGES,
      ),
      REQUEST_TIMEOUT_MS: this.getRequiredNumber(
        'REQUEST_TIMEOUT_MS',
        DEFAULTS.REQUEST_TIMEOUT_MS,
      ),
    };

    this.config = Object.freeze({
      maxRepositories: internalConfig.MAX_REPOSITORIES,
      cacheTimeout: internalConfig.CACHE_TIMEOUT_MS,
      languageStatsLimit: internalConfig.LANGUAGE_STATS_LIMIT,
      randomRepoMaxPages: internalConfig.RANDOM_REPO_MAX_PAGES,
      requestTimeout: internalConfig.REQUEST_TIMEOUT_MS,
    });
  }

  get githubToken(): string {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    if (!token) {
      throw new InternalServerErrorException(
        'GITHUB_TOKEN environment variable is required',
      );
    }
    return token;
  }

  private getRequiredNumber(key: string, defaultValue: number): number {
    const value = this.configService.get<string>(key);
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      throw new InternalServerErrorException(
        `Invalid value for ${key}: must be a positive number`,
      );
    }

    return parsed;
  }
}
