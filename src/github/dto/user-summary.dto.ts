import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested } from 'class-validator';
import { RepositoryDto } from './repository.dto.js';

export class UserSummaryDto {
  @ApiProperty({ description: 'GitHub username', example: 'octocat' })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'User display name',
    example: 'The Octocat',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  name: string | null;

  @ApiProperty({
    description: 'User biography',
    example: 'GitHub mascot',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  bio: string | null;

  @ApiProperty({
    description: 'User location',
    example: 'San Francisco, CA',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  location: string | null;

  @ApiProperty({
    description: 'User company',
    example: '@github',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  company: string | null;

  @ApiProperty({
    description: 'User blog/website URL',
    example: 'https://github.blog',
    nullable: true,
    required: false,
  })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @IsOptional()
  blog: string | null;

  @ApiProperty({
    description: 'User avatar image URL',
    example: 'https://github.com/images/error/octocat_happy.gif',
  })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  avatarUrl: string;

  @ApiProperty({
    description: 'Number of followers',
    example: 4000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  followers: number;

  @ApiProperty({
    description: 'Number of users following',
    example: 9,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  following: number;

  @ApiProperty({
    description: 'Number of public repositories',
    example: 8,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  publicRepos: number;

  @ApiProperty({
    description: 'Number of public gists',
    example: 8,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  publicGists: number;

  @ApiProperty({
    description: 'GitHub profile URL',
    example: 'https://github.com/octocat',
  })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  htmlUrl: string;

  @ApiProperty({
    description: 'Account creation date',
    example: '2011-01-25T18:44:36Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'Profile last update date',
    example: '2021-12-10T19:53:23Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({
    description: 'Top 5 repositories by stars',
    type: [RepositoryDto],
  })
  @ValidateNested({ each: true })
  @Type(() => RepositoryDto)
  topRepositories: RepositoryDto[];

  // Optional metadata
  @ApiProperty({
    description: 'Indicates if the data was served from cache',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  cached?: boolean;

  @ApiProperty({
    description: 'Time taken to fetch the data in milliseconds',
    example: 150,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  responseTime?: number;
}
