// Core GitHub entity interfaces
export interface GitHubUser {
  login: string;
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
  [key: string]: any; // catch-all for extra fields
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  language: string | null;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
  html_url: string;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    name: string | null;
    email: string | null;
    [key: string]: any;
  };
  [key: string]: any; // allows extra properties
}

// API Response interfaces
export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubReadmeResponse {
  name: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
  html_url: string;
  download_url: string;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

// Utility interfaces
export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface LanguageStat {
  name?: string;
  count?: number;
  percentage?: number;
  [key: string]: any;
}

export interface LastCommit {
  sha?: string;
  message?: string;
  date?: string;
  url?: string;
  [key: string]: any;
}

// Transform service specific interface (could also go in a separate dto file)
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
  topRepositories: any[]; // Replace with proper RepositoryDto import
}
