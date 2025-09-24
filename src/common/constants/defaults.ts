/**
 * Default configuration values for GitHub-related operations.
 * These are used when no environment variables are provided.
 * All values are intentionally expressed in base units (milliseconds, counts).
 */
export const DEFAULTS = {
  /**
   * The maximum number of repositories to fetch for a user/org.
   */
  MAX_REPOSITORIES: 12,

  /**
   * How long cached GitHub API responses remain valid (in ms).
   * Default: 5 minutes.
   */
  CACHE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  /**
   * Maximum number of languages to include in language statistics.
   */
  LANGUAGE_STATS_LIMIT: 10,

  /**
   * Maximum number of pages to request when fetching random repos.
   * Prevents runaway queries against the GitHub API.
   */
  RANDOM_REPO_MAX_PAGES: 33,

  /**
   * Maximum time (in ms) to wait for a GitHub API request before failing.
   * Default: 10 seconds.
   */
  REQUEST_TIMEOUT_MS: 10000,
} as const;
