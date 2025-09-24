import { describe, it, expect } from 'vitest';
import { GitHubValidators } from '../github.validators.js';
import { GitHubValidationError } from '../../exceptions/github.exceptions.js';

describe('GitHubValidators', () => {
  describe('validateUsername', () => {
    it('should validate correct username', () => {
      const result = GitHubValidators.validateUsername('testuser');
      expect(result).toBe('testuser');
    });

    it('should sanitize username with @ prefix', () => {
      const result = GitHubValidators.validateUsername('@testuser');
      expect(result).toBe('testuser');
    });

    it('should trim whitespace', () => {
      const result = GitHubValidators.validateUsername('  testuser  ');
      expect(result).toBe('testuser');
    });

    it('should throw error for empty username', () => {
      expect(() => GitHubValidators.validateUsername('')).toThrow(
        GitHubValidationError,
      );
      expect(() => GitHubValidators.validateUsername('   ')).toThrow(
        GitHubValidationError,
      );
    });

    it('should throw error for invalid characters', () => {
      expect(() => GitHubValidators.validateUsername('test@user')).toThrow(
        GitHubValidationError,
      );
      expect(() => GitHubValidators.validateUsername('test user')).toThrow(
        GitHubValidationError,
      );
    });

    it('should throw error for username too long', () => {
      const longUsername = 'a'.repeat(40);
      expect(() => GitHubValidators.validateUsername(longUsername)).toThrow(
        GitHubValidationError,
      );
    });
  });

  describe('validateRepositoryName', () => {
    it('should validate correct repository name', () => {
      const result = GitHubValidators.validateRepositoryName('test-repo');
      expect(result).toBe('test-repo');
    });

    it('should remove .git suffix', () => {
      const result = GitHubValidators.validateRepositoryName('test-repo.git');
      expect(result).toBe('test-repo');
    });

    it('should throw error for empty repository name', () => {
      expect(() => GitHubValidators.validateRepositoryName('')).toThrow(
        GitHubValidationError,
      );
    });

    it('should throw error for invalid characters', () => {
      expect(() =>
        GitHubValidators.validateRepositoryName('test repo'),
      ).toThrow(GitHubValidationError);
      expect(() =>
        GitHubValidators.validateRepositoryName('test@repo'),
      ).toThrow(GitHubValidationError);
    });
  });

  describe('validateStarRange', () => {
    it('should validate correct star range', () => {
      const result = GitHubValidators.validateStarRange(10, 100);
      expect(result).toEqual({ minStars: 10, maxStars: 100 });
    });

    it('should throw error for negative values', () => {
      expect(() => GitHubValidators.validateStarRange(-1, 100)).toThrow(
        GitHubValidationError,
      );
      expect(() => GitHubValidators.validateStarRange(10, -1)).toThrow(
        GitHubValidationError,
      );
    });

    it('should throw error when minStars > maxStars', () => {
      expect(() => GitHubValidators.validateStarRange(100, 10)).toThrow(
        GitHubValidationError,
      );
    });
  });
});
