/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../lib/jwt';
import { authenticateToken } from '../middleware/auth';
import type { 
  User, 
  ApiResponse 
} from '../../shared/types';

// 定义请求类型
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// 定义请求接口
interface AuthRequest extends Request {
  user?: User;
}

const router = Router();

// 临时内存存储（生产环境应使用数据库）
interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const users: Map<string, StoredUser> = new Map();

// 注册
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 验证输入
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // 检查用户是否已存在
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const userId = Date.now().toString();
    const storedUser: StoredUser = {
      id: userId,
      email,
      name,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存到内存存储
    users.set(userId, storedUser);
    
    // 生成令牌
    const token = generateToken({
      id: userId,
      email,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const user = {
      id: userId,
      email,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 登录
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // 查找用户
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 生成令牌
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 刷新令牌
router.post('/refresh', async (req: Request<{}, {}, RefreshTokenRequest>, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // 验证刷新令牌
    const payload = verifyToken(refreshToken) as any;
    
    // 模拟用户信息
    const user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 生成新的令牌
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    res.json({
      success: true,
      data: {
        user,
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: req.user
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 用户登出
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 在实际应用中，这里可以将令牌加入黑名单
    // 目前只是返回成功响应
    res.json({
      success: true,
      message: '登出成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

export default router;