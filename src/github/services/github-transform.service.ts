import { Injectable, Logger } from '@nestjs/common';
import { RepositoryDto } from '../dto/repository.dto.js';
import { ReadmeDto } from '../dto/readme.dto.js';
import { GitHubRepository, GitHubUser } from '../interfaces/github.interfaces.js';
import { GitHubApiService } from './github-api.service.js';

@Injectable()
export class GitHubTransformService {
  private readonly logger = new Logger(GitHubTransformService.name);

  constructor(private readonly apiService: GitHubApiService) {}

  transformToUserSummaryDto(user: GitHubUser, topRepositories: RepositoryDto[]): any {
    return {
      username: user.login,
      name: user.name,
      bio: user.bio,
      location: user.location,
      company: user.company,
      blog: user.blog,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      topRepositories,
    };
  }

  transformToRepositoryDto(repo: GitHubRepository): RepositoryDto {
    return {
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      isPrivate: repo.private,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
      githubUrl: repo.html_url, // Using html_url as githubUrl for consistency
      lastCommitDate: repo.pushed_at || repo.updated_at || repo.created_at || null,
    };
  }

  transformToReadmeDto(data: any, owner: string, repo: string): ReadmeDto {
    return {
      name: data.name || 'README.md',
      path: data.path || `/${owner}/${repo}/README.md`,
      content: data.content || '',
      encoding: data.encoding || 'base64',
      size: data.size || 0,
      htmlUrl: data.html_url || `https://github.com/${owner}/${repo}/blob/main/README.md`,
      downloadUrl: data.download_url || `https://api.github.com/repos/${owner}/${repo}/readme`,
    };
  }

  async transformToRepositoryDtoWithLastCommit(repo: GitHubRepository): Promise<RepositoryDto> {
    let lastCommitDate: string | null = null;

    try {
      // Extract owner and repo name from the repository URL
      const urlParts = repo.html_url?.split('/');
      const owner = urlParts?.[3];
      const repoName = urlParts?.[4];

      if (owner && repoName) {
        const commits = await this.apiService.getRepositoryCommits(owner, repoName, 1);
        
        if (commits?.[0]?.commit) {
          const commit = commits[0].commit;
          lastCommitDate = commit.committer?.date || commit.author?.date || null;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching repository commits: ${errorMessage}`);
    }

    // Fallback to repository dates if commit fetch fails
    if (!lastCommitDate) {
      lastCommitDate = repo.pushed_at || repo.updated_at || repo.created_at || null;
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
      lastCommitDate,
    };
  }

  sortRepositoriesByStars(repos: GitHubRepository[]): GitHubRepository[] {
    return repos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  }

  limitRepositories(repos: GitHubRepository[], limit: number): GitHubRepository[] {
    return repos.slice(0, limit);
  }
}
