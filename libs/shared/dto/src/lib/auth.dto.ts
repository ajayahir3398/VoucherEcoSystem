import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}

export class VerifyBiometricDto {
  @IsNotEmpty()
  @IsString()
  biometricToken!: string;

  @IsNotEmpty()
  @IsString()
  deviceFingerprint!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    name: string;
    email: string;
    role: string;
    photo?: string;
  };
}
