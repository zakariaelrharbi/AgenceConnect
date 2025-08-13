import { z } from 'zod';

// Register DTO
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

// Login DTO
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>['body'];

// Added Refresh Token DTO
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>['body'];

// Auth Response DTOs
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  };
  token: string;
  refreshToken?: string;
}

// Added Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}