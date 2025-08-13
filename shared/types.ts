// 共享类型定义

// 文档状态
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 文档类型
export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  knowledgeBaseId: string;
  status: DocumentStatus;
  processingProgress?: number;
  errorMessage?: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// 知识库类型
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// 文档块类型
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: string;
}

// 对话消息类型
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
}

// 文档来源类型
export interface DocumentSource {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  content: string;
  similarity: number;
}

// 对话会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  knowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// 文件上传进度类型
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// 搜索过滤器类型
export interface DocumentFilter {
  knowledgeBaseId?: string;
  status?: DocumentStatus;
  search?: string;
  fileType?: string;
}

// 用户类型
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 任务类型
export interface Task {
  id: string;
  type: 'document_processing' | 'document_reprocessing';
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

// 聊天请求类型
export interface CreateChatSessionRequest {
  title?: string;
  knowledgeBaseId?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface UpdateSessionTitleRequest {
  sessionId: string;
  title: string;
}