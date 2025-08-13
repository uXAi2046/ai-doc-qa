import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import type { User } from '../../shared/types';

// 定义JWT载荷类型
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// 从请求头提取token
function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.substring(7);
}

// 验证访问令牌
function verifyAccessToken(token: string): JWTPayload {
  return verifyToken(token) as JWTPayload;
}

// 扩展Request接口，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * 认证中间件 - 验证JWT令牌
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
      return;
    }

    // 验证JWT令牌
    const decoded = verifyToken(token) as any;
    
    // 模拟用户信息（实际应该从数据库获取）
    const user: User = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 将用户信息添加到请求对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

/**
 * 可选认证中间件 - 如果有令牌则验证，没有则继续
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      next();
      return;
    }

    // 验证JWT令牌
    const decoded: JWTPayload = verifyAccessToken(token);
    
    // 模拟用户信息（实际应该从数据库获取）
    const user: User = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 将用户信息添加到请求对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    // 可选认证失败时继续执行，不返回错误
    next();
  }
}

/**
 * 管理员权限中间件
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // 模拟管理员检查（实际应该检查用户角色）
  if (req.user.id !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
    return;
  }

  next();
}