import { UserSummaryDto } from '../../dto/user-summary.dto.js';
import { RepositoryDto } from '../../dto/repository.dto.js';

export const createMockUserData = (overrides: Partial<any> = {}) => ({
  login: 'testuser',
  name: 'Test User',
  bio: 'Test Bio',
  location: 'Test Location',
  company: 'Test Company',
  blog: 'https://test.com',
  avatar_url: 'https://avatar.test/avatar.jpg',
  html_url: 'https://github.com/testuser',
  followers: 100,
  following: 50,
  public_repos: 42,
  public_gists: 10,
  created_at: '2010-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockRepoData = (overrides: Partial<any> = {}) => ({
  name: 'test-repo',
  description: 'Test Repository',
  language: 'TypeScript',
  stargazers_count: 100,
  forks_count: 50,
  open_issues_count: 5,
  private: false,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  pushed_at: '2023-01-15T12:00:00Z',
  html_url: 'https://github.com/testuser/test-repo',
  ...overrides,
});

export const createMockReadmeData = (overrides: Partial<any> = {}) => ({
  name: 'README.md',
  path: 'README.md',
  content: 'IyBUZXN0IFJlcG9zaXRvcnk=', // Base64
  encoding: 'base64',
  size: 1024,
  html_url: 'https://github.com/testuser/test-repo/blob/main/README.md',
  download_url:
    'https://api.github.com/repos/testuser/test-repo/contents/README.md',
  ...overrides,
});

export const createMockCommitData = (overrides: Partial<any> = {}) => ({
  sha: 'abc123def',
  commit: {
    message: 'Initial commit',
    committer: { date: '2023-01-15T12:00:00Z' },
    author: { date: '2023-01-15T12:00:00Z' },
  },
  html_url: 'https://github.com/testuser/test-repo/commit/abc123def',
  ...overrides,
});

export const createMockUserSummaryDto = (
  overrides: Partial<UserSummaryDto> = {},
): UserSummaryDto => ({
  username: 'testuser',
  name: 'Test User',
  bio: 'Test Bio',
  location: 'Test Location',
  company: 'Test Company',
  blog: 'https://test.com',
  avatarUrl: 'https://avatar.test/avatar.jpg',
  htmlUrl: 'https://github.com/testuser',
  followers: 100,
  following: 50,
  publicRepos: 42,
  publicGists: 10,
  createdAt: '2010-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  topRepositories: [],
  cached: false,
  responseTime: 100,
  ...overrides,
});

export const createMockRepositoryDto = (
  overrides: Partial<RepositoryDto> = {},
): RepositoryDto => ({
  name: 'test-repo',
  owner: 'testuser',
  description: 'Test Repository',
  language: 'TypeScript',
  stars: 100,
  forks: 50,
  openIssues: 5,
  isPrivate: false,
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  htmlUrl: 'https://github.com/testuser/test-repo',
  lastCommitDate: '2023-01-15T12:00:00Z',
  ...overrides,
});

export const TEST_CONSTANTS = {
  DEFAULT_USERNAME: 'testuser',
  DEFAULT_REPO_OWNER: 'testuser',
  DEFAULT_REPO_NAME: 'test-repo',
  GITHUB_TOKEN: 'mock-github-token',
} as const;

export const GITHUB_API_ERRORS = {
  NOT_FOUND: { status: 404, message: 'Not Found' },
  RATE_LIMITED: { status: 403, message: 'Rate limit exceeded' },
  FORBIDDEN: { status: 403, message: 'Forbidden' },
  INTERNAL_ERROR: { status: 500, message: 'Internal Server Error' },
  NETWORK_ERROR: new Error('Network error'),
} as const;
