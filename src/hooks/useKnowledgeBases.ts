import { useState, useEffect, useCallback } from 'react';
import type { KnowledgeBase, ApiResponse, PaginatedResponse } from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseKnowledgeBasesReturn {
  knowledgeBases: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;
  refreshKnowledgeBases: () => Promise<void>;
}

export function useKnowledgeBases(): UseKnowledgeBasesReturn {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch(`${API_BASE_URL}/knowledge-bases?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<PaginatedResponse<KnowledgeBase>> = await response.json();
      
      if (data.success && data.data) {
        setKnowledgeBases(data.data.data);
      } else {
        throw new Error(data.error || '获取知识库列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取知识库列表失败';
      setError(errorMessage);
      console.error('获取知识库列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshKnowledgeBases = useCallback(async () => {
    await fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  return {
    knowledgeBases,
    isLoading,
    error,
    refreshKnowledgeBases,
  };
}