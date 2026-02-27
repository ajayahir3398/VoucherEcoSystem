import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'rahul@company.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    example: 'fp_abc123',
    description: 'Device fingerprint for JWT binding',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
