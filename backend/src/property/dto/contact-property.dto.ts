import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactPropertyDto {
  @ApiProperty({
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({
    description: 'Inquirer name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Inquirer email',
    example: 'inquirer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Inquirer phone number',
    example: '+971501234567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Inquiry message',
    example: 'I am interested in this property. Please contact me.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;
}

