import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

// 定义请求接口
interface AuthRequest extends Request {
  user?: { id: string; email: string; createdAt: string; updatedAt: string; };
}
import type { 
  CreateChatSessionRequest, 
  SendMessageRequest, 
  UpdateSessionTitleRequest,
  ChatSession,
  ChatMessage
} from '../../shared/types';

const router = Router();

// 模拟数据存储
let mockSessions: ChatSession[] = [];
let mockMessages: ChatMessage[] = [];
let sessionIdCounter = 1;
let messageIdCounter = 1;

// 创建新的聊天会话
router.post('/sessions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, knowledgeBaseId }: CreateChatSessionRequest = req.body;
    const userId = req.user!.id;

    // 创建聊天会话
    const session: ChatSession = {
      id: (sessionIdCounter++).toString(),
      title: title || 'New Chat',
      userId,
      knowledgeBaseId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockSessions.push(session);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取用户的聊天会话列表
router.get('/sessions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 过滤用户的会话
    const userSessions = mockSessions.filter(session => session.userId === userId);
    const total = userSessions.length;
    const paginatedSessions = userSessions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取单个聊天会话详情
router.get('/sessions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = mockSessions.find(s => s.id === id && s.userId === userId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Chat session fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 更新聊天会话标题
router.put('/sessions/:id/title', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title }: UpdateSessionTitleRequest = req.body;
    const userId = req.user!.id;

    if (!title || title.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
      return;
    }

    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);

    if (sessionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
      return;
    }

    // 更新会话标题
    mockSessions[sessionIndex] = {
      ...mockSessions[sessionIndex],
      title: title.trim(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Chat session title update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 删除聊天会话
router.delete('/sessions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const sessionIndex = mockSessions.findIndex(s => s.id === id && s.userId === userId);

    if (sessionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
      return;
    }

    // 删除会话和相关消息
    mockSessions.splice(sessionIndex, 1);
    // mockMessages = mockMessages.filter(m => m.sessionId !== id);

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Chat session delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取聊天消息列表
router.get('/sessions/:sessionId/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // 验证会话是否存在且用户有权限
    const session = mockSessions.find(s => s.id === sessionId && s.userId === userId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
      return;
    }

    // 获取会话的消息
    // 模拟根据sessionId过滤消息
    const sessionMessages = mockMessages; // 暂时返回所有消息
    const total = sessionMessages.length;
    const paginatedMessages = sessionMessages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Chat messages fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 发送消息并获取AI回复
router.post('/sessions/:sessionId/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { content }: SendMessageRequest = req.body;
    const userId = req.user!.id;

    if (!content || content.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Message content cannot be empty'
      });
      return;
    }

    // 验证会话是否存在且用户有权限
    const session = mockSessions.find(s => s.id === sessionId && s.userId === userId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
      return;
    }

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: (messageIdCounter++).toString(),
      // sessionId,
      role: 'user',
      content: content.trim(),
      sources: [],
      timestamp: new Date().toISOString()
    };

    mockMessages.push(userMessage);

    // 生成AI回复
    const aiResponse = await generateAIResponse(content, session.knowledgeBaseId);

    // 创建AI消息
    const aiMessage: ChatMessage = {
      id: (messageIdCounter++).toString(),
      // sessionId,
      role: 'assistant',
      content: aiResponse.content,
      sources: aiResponse.sources,
      timestamp: new Date().toISOString()
    };

    mockMessages.push(aiMessage);

    // 更新会话的最后更新时间
    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      mockSessions[sessionIndex].updatedAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      data: [userMessage, aiMessage]
    });
  } catch (error) {
    console.error('Chat message creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 生成AI回复（模拟RAG功能）
async function generateAIResponse(userMessage: string, knowledgeBaseId?: string): Promise<{ content: string; sources: any[] }> {
  try {
    let sources: any[] = [];
    let contextContent = '';

    // 如果指定了知识库，进行文档检索
    if (knowledgeBaseId) {
      const retrievalResults = await retrieveRelevantChunks(userMessage, knowledgeBaseId);
      sources = retrievalResults.sources;
      contextContent = retrievalResults.context;
    }

    // 模拟AI回复生成
    let aiContent = '';
    
    if (contextContent) {
      // 基于检索到的内容生成回复
      aiContent = `基于您上传的文档内容，我来回答您的问题：\n\n${userMessage}\n\n根据相关文档，${generateContextualResponse(userMessage, contextContent)}`;
    } else {
      // 通用回复
      aiContent = generateGeneralResponse(userMessage);
    }

    return {
      content: aiContent,
      sources
    };
  } catch (error) {
    console.error('AI response generation error:', error);
    return {
      content: '抱歉，我在处理您的问题时遇到了一些困难。请稍后再试。',
      sources: []
    };
  }
}

// 检索相关文档块（模拟版本）
async function retrieveRelevantChunks(query: string, knowledgeBaseId: string): Promise<{ context: string; sources: any[] }> {
  try {
    // 模拟文档检索（实际应该从数据库或向量数据库检索）
    const mockChunks = [
      {
        id: '1',
        content: `关于${query}的相关信息：这是一个模拟的文档内容，包含了与用户查询相关的信息。`,
        documentId: 'doc1',
        documentTitle: '示例文档1',
        chunkIndex: 0
      },
      {
        id: '2',
        content: `进一步的${query}说明：这里提供了更详细的解释和背景信息。`,
        documentId: 'doc2',
        documentTitle: '示例文档2',
        chunkIndex: 1
      }
    ];

    // 简单的关键词匹配
    const relevantChunks = mockChunks.filter(chunk => 
      chunk.content.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().split(' ').some(word => 
        word.length > 2 && chunk.content.toLowerCase().includes(word)
      )
    );

    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');
    const sources = relevantChunks.map(chunk => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content.substring(0, 200) + '...'
    }));

    return { context, sources };
  } catch (error) {
    console.error('Document retrieval error:', error);
    return { context: '', sources: [] };
  }
}

// 基于上下文生成回复
function generateContextualResponse(query: string, context: string): string {
  // 这里应该调用真正的AI模型，现在只是模拟
  const responses = [
    `根据文档内容，${query}的相关信息如下：${context.substring(0, 200)}...`,
    `文档中提到了关于${query}的内容，具体来说：${context.substring(0, 200)}...`,
    `基于您上传的文档，我找到了与${query}相关的信息：${context.substring(0, 200)}...`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// 生成通用回复
function generateGeneralResponse(query: string): string {
  const responses = [
    `关于"${query}"，这是一个很好的问题。不过我需要更多的上下文信息才能给出准确的回答。您可以上传相关文档到知识库中，这样我就能基于您的文档内容来回答问题了。`,
    `我理解您想了解"${query}"的相关信息。建议您先上传相关文档，这样我就能基于具体的文档内容为您提供更准确和详细的回答。`,
    `"${query}"是一个有趣的话题。为了给您提供最准确的信息，建议您上传相关的文档资料，我可以基于这些文档来回答您的问题。`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export default router;