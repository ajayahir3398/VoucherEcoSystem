import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@company.com', description: 'Email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password (min 6 chars)',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'EMPLOYEE',
    enum: ['EMPLOYEE', 'SELLER', 'ADMIN', 'FINANCE'],
    description: 'User role',
  })
  @IsEnum(['EMPLOYEE', 'SELLER', 'ADMIN', 'FINANCE'])
  role!: string;

  @ApiPropertyOptional({
    example: 'Engineering',
    description: 'Department name',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/photo.jpg',
    description: 'Profile photo URL',
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({
    example: 'fp_abc123',
    description: 'Device fingerprint for JWT binding',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
