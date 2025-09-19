// interfaces/github.interface.ts

export interface GitHubUser {
  login: string;
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  avatar_url?: string;
  html_url?: string;
  followers?: number;
  following?: number;
  public_repos?: number;
  public_gists?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // catch-all for extra fields
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string | null;
  language: string | null;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
  html_url: string;
  created_at: string | null;
  updated_at: string | null;
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

export interface RepositoryDto {
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
  githubUrl: string;
  [key: string]: any; // catch-all
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

export interface UserStats {
  username: string;
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  avatarUrl?: string;
  githubUrl?: string;
  followers?: number;
  following?: number;
  publicRepos?: number;
  publicGists?: number;
  createdAt?: string;
  updatedAt?: string;
  topRepositories?: RepositoryDto[];
  languages?: LanguageStat[];
  lastCommit?: LastCommit;
  owner?: string;
  ownerAvatarUrl?: string;
  [key: string]: any;
}
