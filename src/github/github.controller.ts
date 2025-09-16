import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GitHubService, UserStats } from './github.service.js';

@Controller('api/user')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get(':username/summary')
  async getUserSummary(
    @Param('username') username: string,
  ): Promise<UserStats> {
    if (!username || username.trim().length === 0) {
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    }

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
