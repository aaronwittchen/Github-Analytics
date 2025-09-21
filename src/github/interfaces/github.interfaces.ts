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

// This interface is now defined in repository.dto.ts

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

// This interface is now defined in user-summary.dto.ts
