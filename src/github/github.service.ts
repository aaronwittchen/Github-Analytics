import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

export interface UserStats {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string;
  updatedAt: string;
  topRepositories: Repository[];
}

export interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

@Injectable()
export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getUserStats(username: string): Promise<UserStats> {
    try {
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username,
      });

      // Fetch user's repositories (public only, sorted by stars)
      const { data: repos } = await this.octokit.rest.repos.listForUser({
        username,
        type: 'owner',
        sort: 'updated',
        per_page: 10, // Get top 10 repos
      });

      // Transform repository data
      const topRepositories: Repository[] = repos
        .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
        .slice(0, 5)
        .map((repo) => ({
          name: repo.name,
          description: repo.description ?? null,
          language: repo.language ?? null,
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          openIssues: repo.open_issues_count ?? 0,
          isPrivate: repo.private,
          createdAt: repo.created_at ?? '',
          updatedAt: repo.updated_at ?? '',
          htmlUrl: repo.html_url,
        }));

      // Return formatted user stats
      return {
        username: user.login,
        name: user.name,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        avatarUrl: user.avatar_url,
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
        publicGists: user.public_gists,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        topRepositories,
      };
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException(
          `User '${username}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.status === 403) {
        throw new HttpException(
          'GitHub API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Failed to fetch GitHub user data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
