import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GitHubService } from './github.service.js';
import { RepositoryDto } from './dto/repository.dto.js';
import { UserSummaryDto } from './dto/user-summary.dto.js';
import { UsernameParamDto } from './dto/username-param.dto.js';
import { ReadmeDto } from './dto/readme.dto.js';

@Controller('v1')
@ApiTags('GitHub')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('users/:username/summary')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Get GitHub user summary',
    description:
      'Retrieves comprehensive GitHub user information including profile data and top 5 repositories sorted by stars',
  })
  @ApiResponse({
    status: 200,
    description: 'User summary retrieved successfully',
    type: UserSummaryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid username format' })
  @ApiNotFoundResponse({ description: 'GitHub user not found' })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getUserSummary(
    @Param() params: UsernameParamDto,
  ): Promise<UserSummaryDto> {
    try {
      return await this.githubService.getUserStats(params.username);
    } catch (error: unknown) {
      this.handleGitHubError(error, params.username);
    }
  }

  @Get('repositories/random')
  @ApiOperation({
    summary: 'Get a random GitHub repository',
    description: 'Retrieves a random repository from GitHub within the specified star range',
  })
  @ApiResponse({
    status: 200,
    description: 'Random repository retrieved successfully',
    type: RepositoryDto,
  })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getRandomRepository(
    @Query('min_stars') minStars?: number,
    @Query('max_stars') maxStars?: number,
  ): Promise<RepositoryDto> {
    try {
      return await this.githubService.getRandomRepository({
        minStars: minStars ? Number(minStars) : undefined,
        maxStars: maxStars ? Number(maxStars) : undefined,
      });
    } catch (error: unknown) {
      this.handleGitHubError(error);
    }
  }

  @Get('repos/:owner/:repo/readme')
  @ApiOperation({
    summary: 'Get repository README',
    description: 'Retrieves the README file of a GitHub repository',
  })
  @ApiResponse({
    status: 200,
    description: 'Repository README retrieved successfully',
    type: ReadmeDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository or README not found',
  })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getRepositoryReadme(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<ReadmeDto> {
    try {
      return await this.githubService.getRepositoryReadme(owner, repo);
    } catch (error: unknown) {
      this.handleGitHubError(error);
    }
  }

  private handleGitHubError(error: unknown, username?: string): never {
    const status = (error as { status?: number }).status;
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';

    if (status === 404 && username) {
      throw new HttpException(
        `User '${username}' not found`,
        HttpStatus.NOT_FOUND,
      );
    } else if (status === 403) {
      throw new HttpException(
        'GitHub API rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    throw new HttpException(
      message,
      typeof status === 'number' ? status : HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
