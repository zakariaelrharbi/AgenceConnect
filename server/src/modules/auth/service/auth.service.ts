import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { RegisterDto, LoginDto, AuthResponse, RefreshTokenResponse } from '../dto/auth.dto';
import { AppError } from '../../../utils/AppError';
import { config } from '../../../config/server';
import prisma from '../../../config/prisma';
import redisClient from '../../../config/redis';


export class AuthService {
private generateTokens(userId: string, role: Role) {
  const payload = { userId, role };

 const accessToken = jwt.sign(
  { userId, role },
  config.JWT_SECRET,
  { expiresIn: config.JWT_EXPIRES_IN }
);

const refreshToken = jwt.sign(
  { userId, role },
  config.JWT_REFRESH_SECRET,
  { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
);


  return { accessToken, refreshToken };
}


  async register(userData: RegisterDto): Promise<AuthResponse> {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Split name into firstName and lastName
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async login(credentials: LoginDto): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 400);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 400);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 400);
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    try {
      if (token) {
        // Hash token for blacklist
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const decoded = jwt.decode(token) as { exp: number } | null;
        
        if (decoded?.exp) {
          const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
          if (expiresIn > 0) {
            // Fixed Redis set call with proper arguments
            await redisClient.set(`blacklist:${hashedToken}`, 'true', 'EX', expiresIn);
          }
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      // Check if token is blacklisted
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const isBlacklisted = await redisClient.get(`blacklist:${hashedToken}`);
      if (isBlacklisted) {
        throw new AppError('Refresh token invalidated', 401);
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET!) as { 
        userId: string; 
        role: Role 
      };

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        config.JWT_SECRET!,
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; role: Role }> {
    try {
      // Check token blacklist
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await redisClient.get(`blacklist:${hashedToken}`);
      if (isBlacklisted) {
        throw new AppError('Token invalidated', 401);
      }

      const decoded = jwt.verify(token, config.JWT_SECRET!) as { userId: string; role: Role };
      
      // Validate role exists
      if (!Object.values(Role).includes(decoded.role)) {
        throw new AppError('Invalid token payload', 401);
      }
      
      return decoded;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}