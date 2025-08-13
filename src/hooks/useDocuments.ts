import { useState, useEffect, useCallback } from 'react';
import { documentApiMethods } from '../utils/documentApi';
import type { Document, PaginatedResponse } from '../../shared/types';
import type { DocumentListParams, DocumentUploadRequest } from '../utils/documentApi';

// 文档Hook状态
interface UseDocumentsState {
  documents: Document[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  uploadProgress: {
    completed: number;
    total: number;
    currentFile: string;
  } | null;
}

// 文档Hook返回值
interface UseDocumentsReturn extends UseDocumentsState {
  // 数据操作
  fetchDocuments: (params?: DocumentListParams) => Promise<void>;
  uploadDocument: (request: DocumentUploadRequest) => Promise<Document>;
  uploadMultipleDocuments: (files: File[], knowledgeBaseId: string) => Promise<Document[]>;
  deleteDocument: (documentId: string) => Promise<void>;
  reprocessDocument: (documentId: string) => Promise<void>;
  
  // 分页操作
  goToPage: (page: number) => Promise<void>;
  changePageSize: (limit: number) => Promise<void>;
  
  // 搜索和过滤
  searchDocuments: (search: string) => Promise<void>;
  filterByStatus: (status?: string) => Promise<void>;
  filterByKnowledgeBase: (knowledgeBaseId?: string) => Promise<void>;
  
  // 状态重置
  clearError: () => void;
  refreshDocuments: () => Promise<void>;
}

// 默认状态
const defaultState: UseDocumentsState = {
  documents: [],
  loading: false,
  uploading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  uploadProgress: null
};

// 文档管理Hook
export function useDocuments(initialParams?: DocumentListParams): UseDocumentsReturn {
  const [state, setState] = useState<UseDocumentsState>(defaultState);
  const [currentParams, setCurrentParams] = useState<DocumentListParams>(initialParams || {});

  // 获取文档列表
  const fetchDocuments = useCallback(async (params?: DocumentListParams) => {
    const finalParams = { ...currentParams, ...params };
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response: PaginatedResponse<Document> = await documentApiMethods.getList(finalParams);
      
      setState(prev => ({
        ...prev,
        documents: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.pageSize,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        },
        loading: false
      }));
      
      setCurrentParams(finalParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取文档列表失败';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [currentParams]);

  // 上传单个文档
  const uploadDocument = useCallback(async (request: DocumentUploadRequest): Promise<Document> => {
    setState(prev => ({ ...prev, uploading: true, error: null }));
    
    try {
      const response = await documentApiMethods.upload(request);
      
      setState(prev => ({
        ...prev,
        uploading: false,
        documents: [response.data, ...prev.documents]
      }));
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文档上传失败';
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 批量上传文档
  const uploadMultipleDocuments = useCallback(async (
    files: File[], 
    knowledgeBaseId: string
  ): Promise<Document[]> => {
    setState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null,
      uploadProgress: { completed: 0, total: files.length, currentFile: '' }
    }));
    
    try {
      const documents = await documentApiMethods.uploadMultiple(
        files, 
        knowledgeBaseId,
        (completed, total, currentFile) => {
          setState(prev => ({
            ...prev,
            uploadProgress: { completed, total, currentFile }
          }));
        }
      );
      
      setState(prev => ({
        ...prev,
        uploading: false,
        uploadProgress: null,
        documents: [...documents, ...prev.documents]
      }));
      
      return documents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量上传失败';
      setState(prev => ({
        ...prev,
        uploading: false,
        uploadProgress: null,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 删除文档
  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await documentApiMethods.delete(documentId);
      
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除文档失败';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 重新处理文档
  const reprocessDocument = useCallback(async (documentId: string): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await documentApiMethods.reprocess(documentId);
      
      // 更新文档状态为处理中
      setState(prev => ({
        ...prev,
        documents: prev.documents.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'processing' as const }
            : doc
        )
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新处理文档失败';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 分页操作
  const goToPage = useCallback(async (page: number): Promise<void> => {
    await fetchDocuments({ ...currentParams, page });
  }, [fetchDocuments, currentParams]);

  const changePageSize = useCallback(async (limit: number): Promise<void> => {
    await fetchDocuments({ ...currentParams, limit, page: 1 });
  }, [fetchDocuments, currentParams]);

  // 搜索和过滤
  const searchDocuments = useCallback(async (search: string): Promise<void> => {
    await fetchDocuments({ ...currentParams, search, page: 1 });
  }, [fetchDocuments, currentParams]);

  const filterByStatus = useCallback(async (status?: string): Promise<void> => {
    const statusFilter = status && status !== 'all' ? status as 'processing' | 'completed' | 'failed' : undefined;
    await fetchDocuments({ ...currentParams, status: statusFilter, page: 1 });
  }, [fetchDocuments, currentParams]);

  const filterByKnowledgeBase = useCallback(async (knowledgeBaseId?: string): Promise<void> => {
    const kbFilter = knowledgeBaseId && knowledgeBaseId !== 'all' ? knowledgeBaseId : undefined;
    await fetchDocuments({ ...currentParams, knowledgeBaseId: kbFilter, page: 1 });
  }, [fetchDocuments, currentParams]);

  // 状态重置
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshDocuments = useCallback(async (): Promise<void> => {
    await fetchDocuments(currentParams);
  }, [fetchDocuments, currentParams]);

  // 初始化加载
  useEffect(() => {
    fetchDocuments();
  }, []); // 只在组件挂载时执行一次

  return {
    ...state,
    fetchDocuments,
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    reprocessDocument,
    goToPage,
    changePageSize,
    searchDocuments,
    filterByStatus,
    filterByKnowledgeBase,
    clearError,
    refreshDocuments
  };
}

// 导出类型
export type { UseDocumentsReturn, UseDocumentsState };