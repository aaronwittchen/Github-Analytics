import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { GitHubService, UserStats } from './github.service.js';
import { UserSummaryDto } from './dto/user-summary.dto.js';

@ApiTags('users')
@Controller('api/user')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get(':username/summary')
  @ApiOperation({
    summary: 'Get GitHub user summary',
    description:
      'Retrieves comprehensive GitHub user information including profile data and top 5 repositories sorted by stars',
  })
  @ApiParam({
    name: 'username',
    description: 'GitHub username',
    example: 'octocat',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User summary retrieved successfully',
    type: UserSummaryDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid username format or missing username',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid username format' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'GitHub user not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: "User 'nonexistent' not found" },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'GitHub API rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'GitHub API rate limit exceeded' },
      },
    },
  })
  async getUserSummary(
    @Param('username') username: string,
  ): Promise<UserStats> {
    // Basic validation
    if (!username || username.trim().length === 0) {
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    }

    // GitHub usernames can only contain alphanumeric characters and hyphens
    const validUsernameRegex = /^[a-zA-Z0-9-]+$/;
    if (!validUsernameRegex.test(username)) {
      throw new HttpException(
        'Invalid username format',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.githubService.getUserStats(username);
  }
}
