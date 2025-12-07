import { IsEnum, IsOptional, IsNumber, IsString, Min, IsInt, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyType, PropertyPurpose } from '../schemas/property.schema';

export class FilterPropertyDto {
  @ApiPropertyOptional({
    description: 'Filter by property purpose',
    enum: PropertyPurpose,
    example: PropertyPurpose.SALE,
  })
  @IsEnum(PropertyPurpose, { message: 'Invalid property purpose' })
  @IsOptional()
  purpose?: PropertyPurpose;

  @ApiPropertyOptional({
    description: 'Filter by property type',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsEnum(PropertyType, { message: 'Invalid property type' })
  @IsOptional()
  type?: PropertyType;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Dubai',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by location/area',
    example: 'Downtown Dubai',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Minimum price in AED',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in AED',
    example: 5000000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Number of bedrooms',
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Minimum area size in square feet',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minAreaSize?: number;

  @ApiPropertyOptional({
    description: 'Maximum area size in square feet',
    example: 3000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxAreaSize?: number;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 12,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

