import { HttpException, HttpStatus } from '@nestjs/common';

export class GitHubApiError extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly context?: string,
    public readonly originalError?: any,
  ) {
    super(message, statusCode);
    this.name = 'GitHubApiError';
  }
}

export class GitHubNotFoundError extends GitHubApiError {
  constructor(resource: string, context?: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, context);
    this.name = 'GitHubNotFoundError';
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(context?: string) {
    super(
      'GitHub API rate limit exceeded',
      HttpStatus.TOO_MANY_REQUESTS,
      context,
    );
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubValidationError extends GitHubApiError {
  constructor(message: string, context?: string) {
    super(message, HttpStatus.BAD_REQUEST, context);
    this.name = 'GitHubValidationError';
  }
}

export class GitHubConfigError extends GitHubApiError {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Configuration');
    this.name = 'GitHubConfigError';
  }
}
