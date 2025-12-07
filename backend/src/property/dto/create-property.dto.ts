import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsEmail, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType, PropertyPurpose } from '../schemas/property.schema';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Property title',
    example: 'Luxury 3BR Apartment in Downtown Dubai',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Title must be at least 10 characters long' })
  title: string;

  @ApiProperty({
    description: 'Detailed property description',
    example: 'Beautiful apartment with stunning views, modern amenities, and prime location.',
    minLength: 20,
  })
  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters long' })
  description: string;

  @ApiProperty({
    description: 'Property price in AED',
    example: 1500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @ApiProperty({
    description: 'Type of property',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsEnum(PropertyType, { message: 'Invalid property type' })
  type: PropertyType;

  @ApiProperty({
    description: 'Property purpose (sale or rent)',
    enum: PropertyPurpose,
    example: PropertyPurpose.SALE,
  })
  @IsEnum(PropertyPurpose, { message: 'Invalid property purpose' })
  purpose: PropertyPurpose;

  @ApiProperty({
    description: 'Property location/area',
    example: 'Downtown Dubai',
  })
  @IsString()
  @MinLength(2, { message: 'Location must be at least 2 characters long' })
  location: string;

  @ApiProperty({
    description: 'City where property is located',
    example: 'Dubai',
  })
  @IsString()
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  city: string;

  @ApiPropertyOptional({
    description: 'Specific area within the location',
    example: 'Business Bay',
  })
  @IsString()
  @IsOptional()
  area?: string;

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
    description: 'Number of parking spaces',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  parking?: number;

  @ApiPropertyOptional({
    description: 'Property area size in square feet',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  areaSize?: number;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+971501234567',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'contact@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  contactEmail?: string;
}

