import { ApiProperty } from '@nestjs/swagger';

export class RepositoryDto {
  @ApiProperty({
    description: 'Repository name',
    example: 'awesome-project',
  })
  name: string;

  @ApiProperty({
    description: 'Repository description',
    example: 'An awesome open source project',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Primary programming language',
    example: 'TypeScript',
    nullable: true,
  })
  language: string | null;

  @ApiProperty({
    description: 'Number of stars',
    example: 1500,
    minimum: 0,
  })
  stars: number;

  @ApiProperty({
    description: 'Number of forks',
    example: 250,
    minimum: 0,
  })
  forks: number;

  @ApiProperty({
    description: 'Number of open issues',
    example: 12,
    minimum: 0,
  })
  openIssues: number;

  @ApiProperty({
    description: 'Whether the repository is private',
    example: false,
  })
  isPrivate: boolean;

  @ApiProperty({
    description: 'Repository creation date',
    example: '2023-01-15T10:30:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Repository last update date',
    example: '2024-03-20T14:45:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Repository URL on GitHub',
    example: 'https://github.com/username/awesome-project',
  })
  htmlUrl: string;
}

export class UserSummaryDto {
  @ApiProperty({
    description: 'GitHub username',
    example: 'octocat',
  })
  username: string;

  @ApiProperty({
    description: 'User display name',
    example: 'The Octocat',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'User biography',
    example: 'GitHub mascot and developer advocate',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'User location',
    example: 'San Francisco, CA',
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: 'User company',
    example: '@github',
    nullable: true,
  })
  company: string | null;

  @ApiProperty({
    description: 'User blog/website URL',
    example: 'https://github.blog',
    nullable: true,
  })
  blog: string | null;

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
    description: 'Account creation date',
    example: '2011-01-25T18:44:36Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Profile last update date',
    example: '2021-12-10T19:53:23Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Top 5 repositories by stars',
    type: [RepositoryDto],
  })
  topRepositories: RepositoryDto[];
}
