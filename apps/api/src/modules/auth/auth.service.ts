import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: registerDto.role,
      department: registerDto.department,
      photo: registerDto.photo,
      deviceFingerprint: registerDto.deviceFingerprint,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User registered: ${savedUser.email} [${savedUser.role}]`);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update device fingerprint if provided
    if (loginDto.deviceFingerprint) {
      user.deviceFingerprint = loginDto.deviceFingerprint;
      await this.userRepository.save(user);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, loginDto.deviceFingerprint);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshToken = refreshHash;
    await this.userRepository.save(user);

    this.logger.log(`User logged in: ${user.email} [${user.role}]`);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'change-this-secret-in-production',
        ),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token matches stored hash
      const isRefreshValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update stored refresh token
      user.refreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      await this.userRepository.save(user);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      user.refreshToken = undefined;
      await this.userRepository.save(user);
      this.logger.log(`User logged out: ${user.email}`);
    }

    return { success: true };
  }

  async verifyBiometric(biometricDto: {
    biometricToken: string;
    deviceFingerprint: string;
  }) {
    // In production, this would verify against a biometric service (e.g., WebAuthn)
    // For now, we verify the device fingerprint matches the user's registered device
    const user = await this.userRepository.findOne({
      where: { deviceFingerprint: biometricDto.deviceFingerprint },
    });

    if (!user) {
      return { verified: false, reason: 'Device not recognized' };
    }

    this.logger.log(`Biometric verified for user: ${user.email}`);
    return { verified: true, userId: user.id };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(user: User, deviceFingerprint?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      deviceFingerprint: deviceFingerprint || user.deviceFingerprint,
    };

    const expiresIn = this.configService.get<number>('JWT_EXPIRATION', 3600);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      photo: user.photo,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
