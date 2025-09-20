import { ApiProperty, PickType } from '@nestjs/swagger';

export class RepositoryDto {
  @ApiProperty({ description: 'Repository name', example: 'awesome-project' })
  name: string;

  @ApiProperty({
    description: 'Repository description',
    example: 'An awesome project',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Primary programming language',
    example: 'TypeScript',
    nullable: true,
  })
  language: string | null;

  @ApiProperty({ description: 'Number of stars', example: 1500, minimum: 0 })
  stars: number;

  @ApiProperty({ description: 'Number of forks', example: 250, minimum: 0 })
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
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Repository last update date',
    example: '2023-06-20T14:45:30Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Repository URL on GitHub',
    example: 'https://github.com/username/awesome-project',
  })
  htmlUrl: string;

  @ApiProperty({
    description: 'GitHub repository URL',
    example: 'https://github.com/username/awesome-project',
  })
  githubUrl: string;

  @ApiProperty({
    description: 'Date of the last commit',
    example: '2023-06-20T14:45:30Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  lastCommitDate?: string;
}

export class RandomRepositoryDto extends PickType(RepositoryDto, [
  'name',
  'description',
  'language',
  'stars',
  'forks',
  'openIssues',
  'isPrivate',
  'createdAt',
  'updatedAt',
  'htmlUrl',
] as const) {}
