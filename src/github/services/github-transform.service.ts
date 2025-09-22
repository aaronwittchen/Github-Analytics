import { Injectable, Logger } from '@nestjs/common';
import { RepositoryDto } from '../dto/repository.dto.js';
import { ReadmeDto } from '../dto/readme.dto.js';
import {
  GitHubRepository,
  GitHubUser,
  LastCommit,
  LanguageStat,
} from '../interfaces/github.interfaces.js';

export interface UserSummaryDto {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  avatarUrl: string;
  htmlUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string;
  updatedAt: string;
  topRepositories: RepositoryDto[];
}

interface CommitData {
  sha: string;
  commit: {
    message: string;
    author?: {
      name: string;
      email: string;
      date: string;
    };
    committer?: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

interface ReadmeData {
  name?: string;
  path?: string;
  content?: string;
  encoding?: string;
  size?: number;
  html_url?: string;
  download_url?: string;
}

@Injectable()
export class GitHubTransformService {
  private readonly logger = new Logger(GitHubTransformService.name);

  transformToUserSummaryDto(
    user: GitHubUser,
    topRepositories: RepositoryDto[],
  ): UserSummaryDto {
    return {
      username: user.login,
      name: user.name || null,
      bio: user.bio || null,
      location: user.location || null,
      company: user.company || null,
      blog: user.blog || null,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      followers: user.followers || 0,
      following: user.following || 0,
      publicRepos: user.public_repos || 0,
      publicGists: user.public_gists || 0,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      topRepositories,
    };
  }

  transformToRepositoryDto(
    repo: GitHubRepository,
    lastCommit?: LastCommit | null,
  ): RepositoryDto {
    const lastCommitDate = this.determineLastCommitDate(repo, lastCommit);

    return {
      name: repo.name,
      owner: repo.owner?.login || '',
      description: repo.description || null,
      language: repo.language || null,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      isPrivate: repo.private || false,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
      lastCommitDate,
    };
  }

  transformToRepositoryDtoWithCommitData(
    repo: GitHubRepository,
    commitData: CommitData | null,
  ): RepositoryDto {
    let lastCommit: LastCommit | null = null;

    if (commitData?.commit) {
      lastCommit = this.transformCommitToLastCommit(commitData);
    }

    return this.transformToRepositoryDto(repo, lastCommit);
  }

  transformToReadmeDto(
    data: ReadmeData,
    owner: string,
    repo: string,
  ): ReadmeDto {
    const fallbackPath = `/${owner}/${repo}/README.md`;
    const fallbackHtmlUrl = `https://github.com/${owner}/${repo}/blob/main/README.md`;
    const fallbackDownloadUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

    return {
      name: data.name || 'README.md',
      path: data.path || fallbackPath,
      content: data.content || '',
      encoding: data.encoding || 'base64',
      size: data.size || 0,
      htmlUrl: data.html_url || fallbackHtmlUrl,
      downloadUrl: data.download_url || fallbackDownloadUrl,
    };
  }

  transformCommitToLastCommit(commitData: CommitData): LastCommit {
    const commit = commitData.commit;
    const commitDate = commit.committer?.date || commit.author?.date || '';

    return {
      sha: commitData.sha,
      message: commit.message,
      date: commitDate,
      url: commitData.html_url,
    };
  }

  // Batch transformation methods for better performance
  transformRepositoriesToDtos(
    repositories: GitHubRepository[],
    commitMap?: Map<string, CommitData | null>,
  ): RepositoryDto[] {
    return repositories.map((repo) => {
      const repoKey = this.getRepositoryKey(repo);
      const commitData = commitMap?.get(repoKey) || null;

      return this.transformToRepositoryDtoWithCommitData(repo, commitData);
    });
  }

  // Utility methods
  sortRepositoriesByStars(repos: GitHubRepository[]): GitHubRepository[] {
    return [...repos].sort(
      (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0),
    );
  }

  sortRepositoriesByUpdated(repos: GitHubRepository[]): GitHubRepository[] {
    return [...repos].sort((a, b) => {
      const aDate = new Date(a.updated_at || a.created_at);
      const bDate = new Date(b.updated_at || b.created_at);
      return bDate.getTime() - aDate.getTime();
    });
  }

  limitRepositories<T>(items: T[], limit: number): T[] {
    return items.slice(0, Math.max(0, limit));
  }

  filterRepositoriesByLanguage(
    repos: GitHubRepository[],
    language: string,
  ): GitHubRepository[] {
    return repos.filter(
      (repo) => repo.language?.toLowerCase() === language.toLowerCase(),
    );
  }

  filterPublicRepositories(repos: GitHubRepository[]): GitHubRepository[] {
    return repos.filter((repo) => !repo.private);
  }

  // Language statistics
  calculateLanguageStats(repos: GitHubRepository[]): LanguageStat[] {
    const languageMap = new Map<string, number>();
    let totalRepos = 0;

    // Count repositories by language
    repos.forEach((repo) => {
      if (repo.language) {
        const count = languageMap.get(repo.language) || 0;
        languageMap.set(repo.language, count + 1);
        totalRepos++;
      }
    });

    // Convert to LanguageStat array with percentages
    const stats: LanguageStat[] = Array.from(languageMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalRepos > 0 ? Math.round((count / totalRepos) * 100) : 0,
      }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    return stats;
  }

  // Repository analysis methods
  getTopRepositoriesByStars(
    repos: GitHubRepository[],
    limit: number = 10,
  ): GitHubRepository[] {
    return this.limitRepositories(this.sortRepositoriesByStars(repos), limit);
  }

  getRecentRepositories(
    repos: GitHubRepository[],
    limit: number = 10,
  ): GitHubRepository[] {
    return this.limitRepositories(this.sortRepositoriesByUpdated(repos), limit);
  }

  calculateRepositoryStats(repos: GitHubRepository[]) {
    const totalStars = repos.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0,
    );
    const totalForks = repos.reduce(
      (sum, repo) => sum + (repo.forks_count || 0),
      0,
    );
    const languages = this.calculateLanguageStats(repos);
    const publicRepos = this.filterPublicRepositories(repos);

    return {
      totalRepositories: repos.length,
      publicRepositories: publicRepos.length,
      privateRepositories: repos.length - publicRepos.length,
      totalStars,
      totalForks,
      languages,
      mostUsedLanguage: languages[0]?.name || null,
    };
  }

  // Helper methods
  private determineLastCommitDate(
    repo: GitHubRepository,
    lastCommit?: LastCommit | null,
  ): string | null {
    if (lastCommit?.date) {
      return lastCommit.date;
    }

    // Fallback to repository timestamps
    return repo.pushed_at || repo.updated_at || repo.created_at || null;
  }

  private getRepositoryKey(repo: GitHubRepository): string {
    return repo.full_name || `${repo.owner?.login}/${repo.name}`;
  }

  extractOwnerAndRepo(
    repo: GitHubRepository,
  ): { owner: string; name: string } | null {
    // Prefer full_name if available
    if (repo.full_name) {
      const [owner, name] = repo.full_name.split('/');
      if (owner && name) {
        return { owner, name };
      }
    }

    // Fallback to owner object and repo name
    if (repo.owner?.login && repo.name) {
      return { owner: repo.owner.login, name: repo.name };
    }

    // Last resort: parse from HTML URL
    try {
      const url = new URL(repo.html_url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return { owner: pathParts[0], name: pathParts[1] };
      }
    } catch (error) {
      this.logger.warn(
        `Failed to extract owner/repo from URL: ${repo.html_url}`,
      );
    }

    this.logger.warn(`Unable to extract owner and repo name for repository`, {
      repoId: repo.id,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
    });

    return null;
  }
}
