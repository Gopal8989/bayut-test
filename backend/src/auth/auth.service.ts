import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { LoggerService } from '../common/logger/logger.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto) {
    this.logger.info(`Registration attempt for email: ${registerDto.email}`, {
      context: 'AuthService',
    });

    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists - ${registerDto.email}`, {
        context: 'AuthService',
      });
      throw new BadRequestException('Email already exists');
    }

    try {
      const user = await this.userService.create(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.phone,
      );

      const welcomeEmailResult = await this.emailService.sendWelcomeEmail(user.email, user.firstName);
      if (welcomeEmailResult) {
        this.logger.info(`Welcome email sent successfully to: ${user.email}`, {
          context: 'AuthService',
          emailId: welcomeEmailResult.messageId,
        });
      } else {
        this.logger.warn(`Welcome email failed to send to: ${user.email}`, {
          context: 'AuthService',
          reason: 'SMTP timeout or configuration issue',
        });
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update user with refresh token
      await this.userService.updateRefreshToken(user._id.toString(), tokens.refresh_token);

      this.logger.info(`User registered successfully: ${user.email}`, {
        context: 'AuthService',
        userId: user._id.toString(),
      });

      return {
        ...tokens,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.email}`, error.stack, {
        context: 'AuthService',
      });
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    this.logger.info(`Login attempt for email: ${loginDto.email}`, {
      context: 'AuthService',
    });

    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.email}`, {
        context: 'AuthService',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.validatePassword(user, loginDto.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for - ${loginDto.email}`, {
        context: 'AuthService',
        userId: user._id.toString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update user with refresh token and last login
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refresh_token);
    await this.userService.updateLastLogin(user._id.toString());

    this.logger.info(`User logged in successfully: ${user.email}`, {
      context: 'AuthService',
      userId: user._id.toString(),
    });

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.userService.updateRefreshToken(user._id.toString(), tokens.refresh_token);

      return tokens;
    } catch (error) {
      this.logger.warn('Refresh token validation failed', {
        context: 'AuthService',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`, {
        context: 'AuthService',
      });
      throw new NotFoundException('User with this email address does not exist');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await this.userService.setPasswordResetToken(
      user._id.toString(),
      resetToken,
      resetExpires,
    );

    const emailResult = await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    
    if (emailResult) {
      this.logger.info(`Password reset email sent successfully to: ${user.email}`, {
        context: 'AuthService',
        emailId: emailResult.messageId,
      });
      return { message: 'Password reset link has been sent to your email address' };
    } else {
      this.logger.error(`Password reset email failed to send to: ${user.email}`, {
        context: 'AuthService',
        reason: 'SMTP timeout or configuration issue',
      });
      throw new BadRequestException('Failed to send password reset email. Please try again later or contact support.');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findByPasswordResetToken(resetPasswordDto.token);
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.userService.updatePassword(user._id.toString(), resetPasswordDto.newPassword);
    await this.userService.clearPasswordResetToken(user._id.toString());

    this.logger.info(`Password reset successful for user: ${user.email}`, {
      context: 'AuthService',
    });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.userService.validatePassword(
      user,
      changePasswordDto.currentPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userService.updatePassword(userId, changePasswordDto.newPassword);

    this.logger.info(`Password changed for user: ${user.email}`, {
      context: 'AuthService',
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    this.logger.info(`User logged out: ${userId}`, {
      context: 'AuthService',
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user._id.toString() };
    
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutes
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    });

    return {
      access_token,
      refresh_token,
    };
  }
}

