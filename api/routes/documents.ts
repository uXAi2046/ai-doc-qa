import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { addDocumentProcessingTask, addDocumentReprocessingTask } from '../services/taskQueue';
import type { Document, ApiResponse, PaginatedResponse, KnowledgeBase } from '../../shared/types';

// 导入共享的知识库数据存储
import { getMockKnowledgeBases, updateKnowledgeBaseDocumentCount } from './knowledge-bases';

// 模拟文档存储
interface StoredDocument {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  knowledgeBaseId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

let mockDocuments: StoredDocument[] = [];
let docIdCounter = 1;


const router = Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 上传文档
router.post('/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '请选择要上传的文件'
      } as ApiResponse);
      return;
    }

    const { knowledgeBaseId } = req.body;
    
    if (!knowledgeBaseId) {
      res.status(400).json({
        success: false,
        error: '知识库ID是必需的'
      } as ApiResponse);
      return;
    }

    // 验证知识库是否存在且用户有权限
    const mockKnowledgeBases = getMockKnowledgeBases();
    const knowledgeBase = mockKnowledgeBases.find(kb => 
      kb.id === knowledgeBaseId && kb.userId === req.user.id
    );

    if (!knowledgeBase) {
      res.status(404).json({
        success: false,
        error: '知识库不存在'
      } as ApiResponse);
      return;
    }

    // 模拟文档处理（实际应用中应该上传到存储服务）
    const documentId = (docIdCounter++).toString();
    const fileName = req.file.originalname;
    const filePath = `documents/${knowledgeBaseId}/${fileName}`;
    
    // 创建文档记录
    const document: StoredDocument = {
      id: documentId,
      title: fileName,
      fileName: fileName,
      filePath: filePath,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      knowledgeBaseId: knowledgeBaseId,
      status: 'completed', // 简化处理，直接标记为完成
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存到内存存储
    mockDocuments.push(document);
    
    // 更新知识库的文档数量
    updateKnowledgeBaseDocumentCount(knowledgeBaseId, 1);

    // 构造返回的文档对象
    const documentResponse: Document = {
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize,
      fileType: document.fileType,
      knowledgeBaseId: document.knowledgeBaseId,
      status: document.status,
      userId: document.userId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };

    res.status(201).json({
      success: true,
      data: documentResponse
    } as ApiResponse<Document>);

    console.log(`文档 ${document.id} 上传成功到知识库 ${knowledgeBaseId}`);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 获取文档列表
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const {
      knowledgeBaseId,
      page = '1',
      pageSize = '20',
      search = '',
      status,
      fileType
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    // 获取用户有权限的知识库ID列表
    const mockKnowledgeBases = getMockKnowledgeBases();
    const userKnowledgeBaseIds = mockKnowledgeBases
      .filter(kb => kb.userId === req.user!.id)
      .map(kb => kb.id);

    // 过滤文档
    let filteredDocuments = mockDocuments.filter(doc => 
      userKnowledgeBaseIds.includes(doc.knowledgeBaseId)
    );

    // 按知识库过滤
    if (knowledgeBaseId) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.knowledgeBaseId === knowledgeBaseId
      );
    }

    // 按状态过滤
    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.status === status
      );
    }

    // 按文件类型过滤
    if (fileType) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.fileType === fileType
      );
    }

    // 搜索
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.fileName.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    filteredDocuments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 分页
    const total = filteredDocuments.length;
    const paginatedDocuments = filteredDocuments.slice(offset, offset + pageSizeNum);
    const totalPages = Math.ceil(total / pageSizeNum);

    // 转换数据格式
    const documentList: Document[] = paginatedDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      knowledgeBaseId: doc.knowledgeBaseId,
      status: doc.status,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({
      success: true,
      data: {
        data: documentList,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages
        }
      }
    } as ApiResponse<PaginatedResponse<Document>>);
  } catch (error) {
    console.error('Documents list error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 获取单个文档详情
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        knowledge_bases!inner(id, name, user_id)
      `)
      .eq('id', id)
      .eq('knowledge_bases.user_id', req.user.id)
      .single();

    if (error || !document) {
      res.status(404).json({
        success: false,
        error: '文档不存在或无权限访问'
      } as ApiResponse);
      return;
    }

    const documentResponse: Document = {
      id: document.id,
      title: document.title,
      fileName: document.file_name,
      filePath: document.file_path,
      fileSize: document.file_size,
      fileType: document.file_type,
      knowledgeBaseId: document.knowledge_base_id,
      status: document.status,
      userId: document.user_id,
      createdAt: document.created_at,
      updatedAt: document.updated_at
    };

    res.json({
      success: true,
      data: documentResponse
    } as ApiResponse<Document>);
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 删除文档
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // 查找文档
    const documentIndex = mockDocuments.findIndex(doc => doc.id === id);
    if (documentIndex === -1) {
      res.status(404).json({
        success: false,
        error: '文档不存在或无权限删除'
      } as ApiResponse);
      return;
    }

    const document = mockDocuments[documentIndex];
    
    // 检查用户权限
    const mockKnowledgeBases = getMockKnowledgeBases();
    const knowledgeBase = mockKnowledgeBases.find(kb => 
      kb.id === document.knowledgeBaseId && kb.userId === req.user!.id
    );
    
    if (!knowledgeBase) {
      res.status(404).json({
        success: false,
        error: '文档不存在或无权限删除'
      } as ApiResponse);
      return;
    }

    // 从内存中删除文档
    mockDocuments.splice(documentIndex, 1);
    
    // 更新知识库的文档数量
    updateKnowledgeBaseDocumentCount(document.knowledgeBaseId, -1);

    res.json({
      success: true,
      message: '文档删除成功'
    } as ApiResponse);
    
    console.log(`文档 ${id} 删除成功`);
  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

// 重新处理文档
router.post('/:id/reprocess', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '用户未认证'
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // 检查文档是否存在且用户有权限
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select(`
        *,
        knowledge_bases!inner(id, name, user_id)
      `)
      .eq('id', id)
      .eq('knowledge_bases.user_id', req.user.id)
      .single();

    if (fetchError || !document) {
      res.status(404).json({
        success: false,
        error: '文档不存在或无权限操作'
      } as ApiResponse);
      return;
    }

    // 更新文档状态为处理中
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Document status update error:', updateError);
      res.status(500).json({
        success: false,
        error: '文档状态更新失败'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: '文档重新处理已开始'
    } as ApiResponse);

    // 触发文档重新处理任务
    const taskId = addDocumentReprocessingTask(id, 2);
    console.log(`文档 ${id} 重新处理任务已添加到队列，任务ID: ${taskId}`);
  } catch (error) {
    console.error('Document reprocess error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ApiResponse);
  }
});

export default router;