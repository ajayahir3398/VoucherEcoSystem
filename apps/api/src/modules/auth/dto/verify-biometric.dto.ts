import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyBiometricDto {
  @ApiProperty({
    example: 'bio_token_xyz',
    description: 'Biometric verification token (WebAuthn)',
  })
  @IsNotEmpty()
  @IsString()
  biometricToken!: string;

  @ApiProperty({
    example: 'fp_abc123',
    description: 'Device fingerprint to match',
  })
  @IsNotEmpty()
  @IsString()
  deviceFingerprint!: string;
}
