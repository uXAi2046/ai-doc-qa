import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../utils/api';
import type { ChatSession, ChatMessage } from '../../shared/types';

interface UseChatOptions {
  knowledgeBaseId?: string;
  autoLoadSessions?: boolean;
}

interface UseChatReturn {
  // 会话相关
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  currentSessionId: string | null;
  
  // 消息相关
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  
  // 操作方法
  createSession: (title?: string, knowledgeBaseId?: string) => Promise<ChatSession | null>;
  switchSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  
  // 状态
  error: string | null;
  hasMoreMessages: boolean;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { knowledgeBaseId, autoLoadSessions = true } = options;
  
  // 状态管理
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  
  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await chatApi.getSessions(1, 50, knowledgeBaseId);
      if (response.success && response.data) {
        setSessions(response.data.data);
        
        // 如果没有当前会话且有会话列表，选择第一个
        if (!currentSessionId && response.data.data.length > 0) {
          const firstSession = response.data.data[0];
          setCurrentSessionId(firstSession.id);
          setCurrentSession(firstSession);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId, currentSessionId]);
  
  // 加载消息列表
  const loadMessages = useCallback(async (sessionId: string, page = 1, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await chatApi.getMessages(sessionId, page, 20);
      if (response.success && response.data) {
        const newMessages = response.data.data;
        
        if (append) {
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        
        if (response.data && response.data.pagination && response.data.pagination.totalPages) {
          setHasMoreMessages(response.data.pagination.page < response.data.pagination.totalPages);
        }
        setMessagesPage(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载消息失败');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // 创建新会话
  const createSession = useCallback(async (title?: string, kbId?: string): Promise<ChatSession | null> => {
    try {
      setError(null);
      const targetKbId = kbId || knowledgeBaseId;
      
      if (!targetKbId) {
        throw new Error('需要指定知识库ID');
      }
      
      const response = await chatApi.createSession({ 
        title, 
        knowledgeBaseId: targetKbId 
      });
      
      if (response.success && response.data) {
        const newSession = response.data;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setCurrentSession(newSession);
        setMessages([]);
        setMessagesPage(1);
        setHasMoreMessages(false);
        
        return newSession;
      }
      
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建会话失败');
      return null;
    }
  }, [knowledgeBaseId]);
  
  // 切换会话
  const switchSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      const session = sessions.find(s => s.id === sessionId);
      
      if (session) {
        setCurrentSessionId(sessionId);
        setCurrentSession(session);
        await loadMessages(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换会话失败');
    }
  }, [sessions, loadMessages]);
  
  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSessionId || !content.trim()) {
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      const response = await chatApi.sendMessage({
        sessionId: currentSessionId,
        content: content.trim()
      });
      
      if (response.success && response.data) {
        // 添加新消息到列表
        setMessages(prev => [...prev, ...response.data]);
        
        // 更新会话的最后更新时间
        setSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, updatedAt: new Date().toISOString() }
            : session
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息失败');
    } finally {
      setIsSending(false);
    }
  }, [currentSessionId]);
  
  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      
      const response = await chatApi.deleteSession(sessionId);
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // 如果删除的是当前会话，切换到第一个可用会话
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(s => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            await switchSession(remainingSessions[0].id);
          } else {
            setCurrentSessionId(null);
            setCurrentSession(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除会话失败');
    }
  }, [currentSessionId, sessions, switchSession]);
  
  // 更新会话标题
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      setError(null);
      
      const response = await chatApi.updateSessionTitle(sessionId, title);
      if (response.success) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, title }
            : session
        ));
        
        if (currentSessionId === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, title } : null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新标题失败');
    }
  }, [currentSessionId]);
  
  // 加载更多消息
  const loadMoreMessages = useCallback(async () => {
    if (!currentSessionId || !hasMoreMessages || isLoading) {
      return;
    }
    
    await loadMessages(currentSessionId, messagesPage + 1, true);
  }, [currentSessionId, hasMoreMessages, isLoading, messagesPage, loadMessages]);
  
  // 刷新会话列表
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);
  
  // 初始化加载
  useEffect(() => {
    if (autoLoadSessions) {
      loadSessions();
    }
  }, [autoLoadSessions, loadSessions]);
  
  // 当切换会话时加载消息
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, loadMessages]);
  
  return {
    // 状态
    sessions,
    currentSession,
    currentSessionId,
    messages,
    isLoading,
    isSending,
    error,
    hasMoreMessages,
    
    // 方法
    createSession,
    switchSession,
    sendMessage,
    deleteSession,
    updateSessionTitle,
    loadMoreMessages,
    refreshSessions,
  };
}