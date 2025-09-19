import { ApiProperty } from '@nestjs/swagger';
import { RepositoryDto } from './repository.dto.js';

export class UserSummaryDto {
  @ApiProperty({ description: 'GitHub username', example: 'octocat' })
  username: string;

  @ApiProperty({
    description: 'User display name',
    example: 'The Octocat',
    nullable: true,
  })
  name?: string | null;

  @ApiProperty({
    description: 'User biography',
    example: 'GitHub mascot',
    nullable: true,
  })
  bio?: string | null;

  @ApiProperty({
    description: 'User location',
    example: 'San Francisco, CA',
    nullable: true,
  })
  location?: string | null;

  @ApiProperty({
    description: 'User company',
    example: '@github',
    nullable: true,
  })
  company?: string | null;

  @ApiProperty({
    description: 'User blog/website URL',
    example: 'https://github.blog',
    nullable: true,
  })
  blog?: string | null;

  @ApiProperty({
    description: 'User avatar image URL',
    example: 'https://github.com/images/error/octocat_happy.gif',
  })
  avatarUrl: string;

  @ApiProperty({
    description: 'Number of followers',
    example: 4000,
    minimum: 0,
  })
  followers: number;

  @ApiProperty({
    description: 'Number of users following',
    example: 9,
    minimum: 0,
  })
  following: number;

  @ApiProperty({
    description: 'Number of public repositories',
    example: 8,
    minimum: 0,
  })
  publicRepos: number;

  @ApiProperty({
    description: 'Number of public gists',
    example: 8,
    minimum: 0,
  })
  publicGists: number;

  @ApiProperty({
    description: 'GitHub profile URL',
    example: 'https://github.com/octocat',
  })
  githubUrl: string;

  @ApiProperty({
    description: 'Account creation date',
    example: '2011-01-25T18:44:36Z',
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Profile last update date',
    example: '2021-12-10T19:53:23Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Top 5 repositories by stars',
    type: [RepositoryDto],
  })
  topRepositories: RepositoryDto[];

  @ApiProperty({ description: 'Repository owner username', example: 'octocat' })
  owner: string;

  @ApiProperty({
    description: 'Repository owner avatar URL',
    example: 'https://github.com/images/error/octocat_happy.gif',
  })
  ownerAvatarUrl: string;
}
