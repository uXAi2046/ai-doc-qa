import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  KnowledgeBase,
  ApiResponse,
  PaginatedResponse
} from '../../shared/types';

// 定义请求接口
interface AuthRequest extends Request {
  user?: { id: string; email: string; createdAt: string; updatedAt: string; };
}

interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
}

const router = Router();

// 模拟数据存储
let mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: '1',
    name: '技术文档库',
    description: '包含各种技术文档和API说明',
    // visibility: 'private',
    userId: '1',
    documentCount: 5,
    // memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: '产品手册',
    description: '产品使用说明和常见问题',
    // visibility: 'private',
    userId: '1',
    documentCount: 3,
    // memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
let kbIdCounter = 3;

// 导出共享函数
export function getMockKnowledgeBases(): KnowledgeBase[] {
  return mockKnowledgeBases;
}

export function updateKnowledgeBaseDocumentCount(id: string, increment: number = 1): void {
  const kbIndex = mockKnowledgeBases.findIndex(kb => kb.id === id);
  if (kbIndex !== -1) {
    mockKnowledgeBases[kbIndex].documentCount += increment;
    mockKnowledgeBases[kbIndex].updatedAt = new Date().toISOString();
  }
}

// 创建知识库
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { name, description, visibility = 'private' }: CreateKnowledgeBaseRequest = req.body;

    // 验证输入
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: '知识库名称是必需的'
      } as ApiResponse);
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        success: false,
        error: '知识库名称不能超过100个字符'
      } as ApiResponse);
      return;
    }

    if (description && description.length > 500) {
      res.status(400).json({
        success: false,
        error: '描述不能超过500个字符'
      } as ApiResponse);
      return;
    }

    // 检查用户是否已有同名知识库
    const existingKB = mockKnowledgeBases.find(kb => 
      kb.name === name.trim() && kb.userId === req.user!.id
    );

    if (existingKB) {
      res.status(409).json({
        success: false,
        error: '您已有同名的知识库'
      } as ApiResponse);
      return;
    }

    // 创建知识库
    const newKnowledgeBase: KnowledgeBase = {
      id: (kbIdCounter++).toString(),
      name: name.trim(),
      description: description?.trim() || null,
      // visibility,
      userId: req.user.id,
      documentCount: 0,
      // memberCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockKnowledgeBases.push(newKnowledgeBase);

    res.status(201).json({
      success: true,
      data: newKnowledgeBase
    } as ApiResponse<KnowledgeBase>);
  } catch (error) {
    console.error('Knowledge base creation error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 获取知识库列表
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const {
      page = '1',
      limit = '10',
      search = '',
      visibility
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // 过滤用户的知识库
    let userKnowledgeBases = mockKnowledgeBases.filter(kb => kb.userId === req.user!.id);

    // 按可见性过滤
    if (visibility && (visibility === 'public' || visibility === 'private')) {
      // userKnowledgeBases = userKnowledgeBases.filter(kb => kb.visibility === visibility);
    }

    // 搜索
    if (search) {
      const searchLower = (search as string).toLowerCase();
      userKnowledgeBases = userKnowledgeBases.filter(kb => 
        kb.name.toLowerCase().includes(searchLower) ||
        (kb.description && kb.description.toLowerCase().includes(searchLower))
      );
    }

    // 排序
    userKnowledgeBases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = userKnowledgeBases.length;
    const paginatedKnowledgeBases = userKnowledgeBases.slice(offset, offset + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        data: paginatedKnowledgeBases,
        pagination: {
          page: pageNum,
          pageSize: limitNum,
          total,
          totalPages
        }
      }
    } as ApiResponse<PaginatedResponse<KnowledgeBase>>);
  } catch (error) {
    console.error('Knowledge bases list error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 获取单个知识库详情
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const knowledgeBase = mockKnowledgeBases.find(kb => 
      kb.id === id && kb.userId === req.user!.id
    );

    if (!knowledgeBase) {
      res.status(404).json({
        success: false,
        error: '知识库不存在或无权限访问'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: knowledgeBase
    } as ApiResponse<KnowledgeBase>);
  } catch (error) {
    console.error('Knowledge base fetch error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 更新知识库
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const { name, description, visibility }: UpdateKnowledgeBaseRequest = req.body;

    // 验证输入
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '知识库名称不能为空'
        } as ApiResponse);
        return;
      }

      if (name.length > 100) {
        res.status(400).json({
          success: false,
          error: '知识库名称不能超过100个字符'
        } as ApiResponse);
        return;
      }
    }

    if (description !== undefined && description.length > 500) {
      res.status(400).json({
        success: false,
        error: '描述不能超过500个字符'
      } as ApiResponse);
      return;
    }

    // 检查知识库是否存在且用户有权限
    const existingKBIndex = mockKnowledgeBases.findIndex(kb => 
      kb.id === id && kb.userId === req.user!.id
    );

    if (existingKBIndex === -1) {
      res.status(404).json({
        success: false,
        error: '知识库不存在或无权限修改'
      } as ApiResponse);
      return;
    }

    const existingKB = mockKnowledgeBases[existingKBIndex];

    // 如果要修改名称，检查是否与其他知识库重名
    if (name && name.trim() !== existingKB.name) {
      const duplicateKB = mockKnowledgeBases.find(kb => 
        kb.name === name.trim() && kb.userId === req.user!.id && kb.id !== id
      );

      if (duplicateKB) {
        res.status(409).json({
          success: false,
          error: '您已有同名的知识库'
        } as ApiResponse);
        return;
      }
    }

    // 更新知识库
    const updatedKB: KnowledgeBase = {
      ...existingKB,
      name: name !== undefined ? name.trim() : existingKB.name,
      description: description !== undefined ? (description.trim() || null) : existingKB.description,
      // visibility: visibility !== undefined ? visibility : existingKB.visibility,
      updatedAt: new Date().toISOString()
    };

    mockKnowledgeBases[existingKBIndex] = updatedKB;

    res.json({
      success: true,
      data: updatedKB
    } as ApiResponse<KnowledgeBase>);
  } catch (error) {
    console.error('Knowledge base update error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 删除知识库
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // 检查知识库是否存在且用户有权限
    const knowledgeBaseIndex = mockKnowledgeBases.findIndex(kb => 
      kb.id === id && kb.userId === req.user!.id
    );

    if (knowledgeBaseIndex === -1) {
      res.status(404).json({
        success: false,
        error: '知识库不存在或无权限删除'
      } as ApiResponse);
      return;
    }

    // 删除知识库
    mockKnowledgeBases.splice(knowledgeBaseIndex, 1);

    res.json({
      success: true,
      message: '知识库删除成功'
    } as ApiResponse);
  } catch (error) {
    console.error('Knowledge base delete error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 获取知识库统计信息
router.get('/:id/stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // 检查知识库权限
    const knowledgeBase = mockKnowledgeBases.find(kb => 
      kb.id === id && kb.userId === req.user!.id
    );

    if (!knowledgeBase) {
      res.status(404).json({
        success: false,
        error: '知识库不存在或无权限访问'
      } as ApiResponse);
      return;
    }

    // 模拟统计信息
    const stats = {
      totalDocuments: knowledgeBase.documentCount,
      processingDocuments: 0,
      completedDocuments: knowledgeBase.documentCount,
      failedDocuments: 0,
      totalSize: knowledgeBase.documentCount * 1024 * 1024, // 模拟每个文档1MB
      totalChunks: knowledgeBase.documentCount * 10 // 模拟每个文档10个块
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<typeof stats>);
  } catch (error) {
    console.error('Knowledge base stats error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

export default router;