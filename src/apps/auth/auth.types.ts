export interface RegisterDto {
  email: string;
  password?: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    verified: boolean;
  };
}

export interface EmailVerificationDto {
  token: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface MagicLinkLoginDto {
  email: string;
}

export interface VerifyMagicLinkDto {
  token: string;
} 