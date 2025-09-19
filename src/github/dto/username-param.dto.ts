import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UsernameParamDto {
  @ApiProperty({
    description: 'GitHub username',
    example: 'octocat',
    minLength: 1,
    maxLength: 39,
    pattern: '^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$/i',
  })
  @IsString()
  @Length(1, 39, {
    message: 'Username must be between 1 and 39 characters long',
  })
  @Matches(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, {
    message:
      'Invalid GitHub username format. Username can only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.',
  })
  username: string;
}
