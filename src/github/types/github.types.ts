// types/github.types.ts

export interface GitHubServiceConfig {
  maxRepositories: number;
  languageStatsLimit: number;
  randomRepoMaxPages: number;
  cacheTimeout: number;
}
