import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RandomRepositoryQueryDto {
  @ApiProperty({
    description: 'Minimum number of stars',
    example: 100,
    required: false,
    minimum: 0,
    maximum: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'min_stars must be a number' })
  @Min(0, { message: 'min_stars must be at least 0' })
  @Max(1000000, { message: 'min_stars must be at most 1,000,000' })
  min_stars?: number;

  @ApiProperty({
    description: 'Maximum number of stars',
    example: 10000,
    required: false,
    minimum: 0,
    maximum: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'max_stars must be a number' })
  @Min(0, { message: 'max_stars must be at least 0' })
  @Max(1000000, { message: 'max_stars must be at most 1,000,000' })
  max_stars?: number;
}
