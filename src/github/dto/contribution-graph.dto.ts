import { ApiProperty } from '@nestjs/swagger';

export class ContributionDayDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-09-22',
  })
  date: string;

  @ApiProperty({
    description: 'Number of contributions on this day',
    example: 3,
  })
  count: number;
}

export class ContributionWeekDto {
  @ApiProperty({
    description: 'Array of 7 days, starting from Sunday',
    type: [ContributionDayDto],
  })
  days: ContributionDayDto[];
}

export class ContributionGraphResponseDto {
  @ApiProperty({
    description: 'Array of weeks, each containing 7 days of contribution data',
    type: () => [[ContributionDayDto]],
    isArray: true
  })
  weeks: Array<Array<ContributionDayDto>>;

  @ApiProperty({
    description: 'Total number of contributions in the selected time period',
    example: 234,
  })
  totalContributions: number;

  @ApiProperty({
    description: 'Array of month labels for the graph header',
    example: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    type: [String],
  })
  monthLabels: string[];

  @ApiProperty({
    description: 'Indicates if the data was served from cache',
    example: false,
    required: false,
  })
  cached?: boolean;
}
