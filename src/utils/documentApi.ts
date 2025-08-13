import { apiClient } from './api';
import type { Document, ApiResponse, PaginatedResponse } from '../../shared/types';

// 文档上传请求
export interface DocumentUploadRequest {
  file: File;
  knowledgeBaseId: string;
  title?: string;
}

// 文档列表查询参数
export interface DocumentListParams {
  knowledgeBaseId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: 'processing' | 'completed' | 'failed';
}

// 文档API客户端
export class DocumentApiClient {
  /**
   * 上传文档
   */
  async uploadDocument(file: File, knowledgeBaseId: string, title?: string): Promise<{ success: boolean; data: Document }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('knowledgeBaseId', knowledgeBaseId);
    
    if (title) {
      formData.append('title', title);
    }

    const response = await fetch(`${apiClient.baseURL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload document');
    }

    const result = await response.json();
    return result;
  }

  /**
   * 获取文档列表
   */
  async getDocuments(params: DocumentListParams = {}): Promise<PaginatedResponse<Document>> {
    const searchParams = new URLSearchParams();
    
    if (params.knowledgeBaseId) {
      searchParams.append('knowledgeBaseId', params.knowledgeBaseId);
    }
    if (params.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.status) {
      searchParams.append('status', params.status);
    }

    const url = `${apiClient.baseURL}/documents${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('获取文档列表失败');
    }

    const result: ApiResponse<PaginatedResponse<Document>> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || '获取文档列表失败');
    }

    return result.data;
  }

  /**
   * 获取单个文档详情
   */
  async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${apiClient.baseURL}/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('获取文档详情失败');
    }

    const result: ApiResponse<Document> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || '获取文档详情失败');
    }

    return result.data;
  }

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${apiClient.baseURL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('删除文档失败');
    }

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除文档失败');
    }
  }

  /**
   * 重新处理文档
   */
  async reprocessDocument(documentId: string): Promise<void> {
    const response = await fetch(`${apiClient.baseURL}/documents/${documentId}/reprocess`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('重新处理文档失败');
    }

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '重新处理文档失败');
    }
  }

  /**
   * 批量上传文档
   */
  async uploadMultipleDocuments(
    files: File[], 
    knowledgeBaseId: string,
    onProgress?: (completed: number, total: number, currentFile: string) => void
  ): Promise<Document[]> {
    const results: Document[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        onProgress?.(i, files.length, file.name);
        
        const response = await this.uploadDocument(
          file,
          knowledgeBaseId,
          file.name
        );
        
        const document = response.data;
        
        results.push(document);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        errors.push(`${file.name}: ${errorMessage}`);
        console.error(`文件 ${file.name} 上传失败:`, error);
      }
    }

    onProgress?.(files.length, files.length, '');

    if (errors.length > 0) {
      console.warn('部分文件上传失败:', errors);
    }

    return results;
  }
}

// 创建文档API客户端实例
export const documentApi = new DocumentApiClient();

// 导出便捷方法
export const documentApiMethods = {
  upload: (request: DocumentUploadRequest) => documentApi.uploadDocument(request.file, request.knowledgeBaseId, request.title),
  getList: (params?: DocumentListParams) => documentApi.getDocuments(params),
  getById: (id: string) => documentApi.getDocument(id),
  delete: (id: string) => documentApi.deleteDocument(id),
  reprocess: (id: string) => documentApi.reprocessDocument(id),
  uploadMultiple: (
    files: File[], 
    knowledgeBaseId: string, 
    onProgress?: (completed: number, total: number, currentFile: string) => void
  ) => documentApi.uploadMultipleDocuments(files, knowledgeBaseId, onProgress)
};