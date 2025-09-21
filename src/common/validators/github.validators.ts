import { GitHubValidationError } from '../exceptions/github.exceptions.js';

/**
 * Utility class for validating GitHub-related input parameters.
 * All methods throw GitHubValidationError if validation fails.
 */
export class GitHubValidators {
  /**
   * Validates and sanitizes a GitHub username.
   * - Removes leading '@' symbols and trims whitespace
   * - Checks non-empty, max length 39
   * - Ensures valid GitHub username characters
   * 
   * @param username - The username to validate
   * @returns The sanitized username
   * @throws GitHubValidationError if validation fails
   */
  static validateUsername(username: string): string {
    if (!username || typeof username !== 'string') {
      throw new GitHubValidationError('Username is required', 'validateUsername');
    }

    // Remove leading '@' and trim spaces
    const sanitized = username.trim().replace(/^@/, '');
    
    if (!sanitized) {
      throw new GitHubValidationError('Username cannot be empty', 'validateUsername');
    }

    if (sanitized.length > 39) {
      throw new GitHubValidationError('Username too long (max 39 characters)', 'validateUsername');
    }

    // Must start with alphanumeric, can contain hyphens (but not consecutively)
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(sanitized)) {
      throw new GitHubValidationError('Invalid username format', 'validateUsername');
    }

    return sanitized;
  }

  /**
   * Validates and sanitizes a GitHub repository name.
   * - Removes trailing '.git' and trims whitespace
   * - Checks non-empty, max length 100
   * - Allows only letters, numbers, '.', '_', and '-'
   * 
   * @param repo - The repository name to validate
   * @returns The sanitized repository name
   * @throws GitHubValidationError if validation fails
   */
  static validateRepositoryName(repo: string): string {
    if (!repo || typeof repo !== 'string') {
      throw new GitHubValidationError('Repository name is required', 'validateRepositoryName');
    }

    // Remove trailing '.git' and trim spaces
    const sanitized = repo.trim().replace(/\.git$/, '');
    
    if (!sanitized) {
      throw new GitHubValidationError('Repository name cannot be empty', 'validateRepositoryName');
    }

    if (sanitized.length > 100) {
      throw new GitHubValidationError('Repository name too long (max 100 characters)', 'validateRepositoryName');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
      throw new GitHubValidationError('Invalid repository name format', 'validateRepositoryName');
    }

    return sanitized;
  }

  /**
   * Validates a repository owner (GitHub username).
   * Internally uses validateUsername for consistency.
   * 
   * @param owner - The repository owner to validate
   * @returns The sanitized owner username
   */
  static validateOwner(owner: string): string {
    return this.validateUsername(owner);
  }

  /**
   * Validates a star range filter for repositories.
   * - Ensures minStars and maxStars are non-negative integers
   * - Ensures minStars <= maxStars
   * 
   * @param minStars - Optional minimum stars
   * @param maxStars - Optional maximum stars
   * @returns Sanitized star range object
   * @throws GitHubValidationError if validation fails
   */
  static validateStarRange(minStars?: number, maxStars?: number): { minStars?: number; maxStars?: number } {
    if (minStars !== undefined) {
      if (!Number.isInteger(minStars) || minStars < 0) {
        throw new GitHubValidationError('minStars must be a non-negative integer', 'validateStarRange');
      }
    }

    if (maxStars !== undefined) {
      if (!Number.isInteger(maxStars) || maxStars < 0) {
        throw new GitHubValidationError('maxStars must be a non-negative integer', 'validateStarRange');
      }
    }

    if (minStars !== undefined && maxStars !== undefined && minStars > maxStars) {
      throw new GitHubValidationError('minStars cannot be greater than maxStars', 'validateStarRange');
    }

    return { minStars, maxStars };
  }
}
