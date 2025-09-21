import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public username?: string,
    public repository?: string,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

@Catch()
export class GitHubExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GitHubExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // If it's already an HttpException, let NestJS handle it
    if (exception instanceof HttpException) {
      throw exception;
    }

    // Handle GitHub API errors
    const status = exception?.status || exception?.response?.status;
    const message = exception?.message || 'An unknown error occurred';
    const username = exception?.username;
    const repository = exception?.repository;

    let httpStatus: HttpStatus;
    let errorMessage: string;

    switch (status) {
      case 404:
        httpStatus = HttpStatus.NOT_FOUND;
        if (username) {
          errorMessage = `User '${username}' not found`;
        } else if (repository) {
          errorMessage = `Repository '${repository}' not found`;
        } else {
          errorMessage = 'Resource not found';
        }
        break;
      case 403:
        httpStatus = HttpStatus.TOO_MANY_REQUESTS;
        errorMessage =
          'GitHub API rate limit exceeded. Please try again later.';
        break;
      case 422:
        httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
        errorMessage = 'Invalid request to GitHub API';
        break;
      default:
        httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = message || 'GitHub API error occurred';
    }

    // Log the error for debugging
    this.logger.error(`GitHub API Error: ${errorMessage}`, {
      status: status,
      originalMessage: message,
      username,
      repository,
      url: request.url,
      method: request.method,
    });

    response.status(httpStatus).json({
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: this.getErrorType(httpStatus),
      message: errorMessage,
    });
  }

  private getErrorType(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      default:
        return 'Internal Server Error';
    }
  }
}
