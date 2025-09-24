import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseFilters,
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
import { ContributionGraphResponseDto } from './dto/contribution-graph.dto.js';
import { GitHubExceptionFilter } from './filters/github-exception.filter.js';
import { RandomRepositoryQueryDto } from './dto/random-repository-query.dto.js';

@Controller('v1')
@ApiTags('GitHub')
@UseFilters(GitHubExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('users/:username/summary')
  @ApiOperation({
    summary: 'Get GitHub user summary',
    description:
      'Retrieves comprehensive GitHub user information including profile data and top repositories sorted by stars',
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
    @Query('limit') limit?: string,
  ): Promise<UserSummaryDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const result = await this.githubService.getUserStats(params.username, parsedLimit);
    // Return only the DTO properties, excluding metadata
    const { cached, responseTime, ...userSummary } = result;
    return userSummary;
  }

  @Get('repositories/random')
  @ApiOperation({
    summary: 'Get a random GitHub repository',
    description:
      'Retrieves a random repository from GitHub within the specified star range and optional country',
  })
  @ApiResponse({
    status: 200,
    description: 'Random repository retrieved successfully',
    type: RepositoryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getRandomRepository(
    @Query() query: RandomRepositoryQueryDto,
  ): Promise<RepositoryDto> {
    return await this.githubService.getRandomRepository({
      minStars: query.min_stars,
      maxStars: query.max_stars,
      language: query.language,
      country: query.country,
    });
  }

  @Get('users/:username/contributions')
  @ApiOperation({
    summary: 'Get user contribution graph data',
    description: 'Retrieves contribution data for the specified user',
  })
  @ApiResponse({
    status: 200,
    description: 'Contribution data retrieved successfully',
    type: ContributionGraphResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid username format' })
  @ApiNotFoundResponse({ description: 'GitHub user not found' })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getUserContributionGraph(
    @Param() params: UsernameParamDto,
  ): Promise<ContributionGraphResponseDto> {
    return this.githubService.getContributionGraph(params.username);
  }

  @Get('repos/:owner/:repo')
  @ApiOperation({
    summary: 'Get repository details',
    description: 'Retrieves details of a specific GitHub repository',
  })
  @ApiResponse({
    status: 200,
    description: 'Repository details retrieved successfully',
    type: RepositoryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found',
  })
  @ApiTooManyRequestsResponse({ description: 'GitHub API rate limit exceeded' })
  async getRepository(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<RepositoryDto> {
    const result = await this.githubService.getRepository(owner, repo);
    // Return only the DTO properties, excluding metadata
    const { cached, ...repository } = result;
    return repository;
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
    const result = await this.githubService.getRepositoryReadme(owner, repo);
    // Return only the DTO properties, excluding metadata
    const { cached, ...readme } = result;
    return readme;
  }
}
