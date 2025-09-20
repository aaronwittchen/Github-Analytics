import { ApiProperty } from '@nestjs/swagger';

export class ReadmeDto {
  @ApiProperty({
    description: 'Name of the README file',
    example: 'README.md',
  })
  name: string;

  @ApiProperty({
    description: 'Path to the README file',
    example: 'username/repo/README.md',
  })
  path: string;

  @ApiProperty({
    description: 'Base64 encoded content of the README',
    example:
      'IyBFeGFtcGxlIFJFQURNRSBmaWxlCkRlc2NyaXB0aW9uIG9mIHRoZSBwcm9qZWN0Lg==',
  })
  content: string;

  @ApiProperty({
    description: 'Encoding of the content (usually base64)',
    example: 'base64',
  })
  encoding: string;

  @ApiProperty({
    description: 'Size of the README file in bytes',
    example: 1024,
  })
  size: number;

  @ApiProperty({
    description: 'URL to view the README on GitHub',
    example: 'https://github.com/username/repo/blob/main/README.md',
  })
  htmlUrl: string;

  @ApiProperty({
    description: 'URL to download the README',
    example: 'https://api.github.com/repos/username/repo/readme',
  })
  downloadUrl: string;
}
