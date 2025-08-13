import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 导入路由
import authRoutes from './routes/auth';
import documentsRoutes from './routes/documents';
import knowledgeBasesRoutes from './routes/knowledge-bases';
import chatRoutes from './routes/chat';

// 导入类型
import type { ApiResponse } from '../shared/types';

const app = express();
const PORT = process.env.PORT || 3002;

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // 生产环境域名
    : ['http://localhost:5173', 'http://localhost:3000'], // 开发环境
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`${new Date().toISOString()} - ${ip} - ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
});

// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  } as ApiResponse);
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/knowledge-bases', knowledgeBasesRoutes);
app.use('/api/chat', chatRoutes);

// 404处理
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `路由 ${req.method} ${req.originalUrl} 不存在`
  } as ApiResponse);
});

// 全局错误处理中间件
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Multer错误处理
  if (error.message === '不支持的文件类型') {
    res.status(400).json({
      success: false,
      error: error.message
    } as ApiResponse);
    return;
  }
  
  // 文件大小超限错误
  if (error.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: '文件大小超过限制（最大10MB）'
    } as ApiResponse);
    return;
  }
  
  // JWT错误处理
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: '无效的访问令牌'
    } as ApiResponse);
    return;
  }
  
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: '访问令牌已过期'
    } as ApiResponse);
    return;
  }
  
  // 默认错误响应
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message
  } as ApiResponse);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason, 'at:', promise);
  process.exit(1);
});

// 启动服务器
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 API服务器运行在端口 ${PORT}`);
    console.log(`📖 API文档: http://localhost:${PORT}/health`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;