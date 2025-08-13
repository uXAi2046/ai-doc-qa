import jwt from 'jsonwebtoken';
import type { User } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'ai_doc_qa_jwt_secret_2024_development_key_very_long_and_secure_random_string_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ai_doc_qa_refresh_jwt_secret_2024_development_key_different_very_long_and_secure_random_string_67890';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// 验证JWT密钥配置
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️  JWT密钥环境变量未配置，使用默认值（仅用于开发环境）');
}

if (process.env.NODE_ENV === 'production' && (JWT_SECRET.includes('development') || JWT_REFRESH_SECRET.includes('development'))) {
  throw new Error('生产环境必须配置安全的JWT密钥');
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

/**
 * 生成访问令牌
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'ai-doc-qa',
    audience: 'ai-doc-qa-users'
  });
}

/**
 * 生成刷新令牌
 */
export function generateRefreshToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'ai-doc-qa',
    audience: 'ai-doc-qa-users'
  });
}

/**
 * 验证访问令牌
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-doc-qa',
      audience: 'ai-doc-qa-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * 验证刷新令牌
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ai-doc-qa',
      audience: 'ai-doc-qa-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * 从请求头中提取令牌
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export { verifyAccessToken as verifyToken };