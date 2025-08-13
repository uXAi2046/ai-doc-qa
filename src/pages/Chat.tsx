import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, RotateCcw, FileText, ExternalLink, Trash2, Edit2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useKnowledgeBases } from '../hooks/useKnowledgeBases';
import type { ChatMessage } from '../../shared/types';

interface Source {
  id: string;
  title: string;
  content: string;
  page?: number;
  documentId: string;
}

export default function Chat() {
  const [inputValue, setInputValue] = useState('');
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // 获取知识库列表
  const { knowledgeBases, isLoading: isLoadingKB } = useKnowledgeBases();
  
  const {
    sessions,
    currentSession,
    currentSessionId,
    messages,
    isLoading,
    isSending,
    error,
    hasMoreMessages,
    createSession,
    switchSession,
    sendMessage,
    deleteSession,
    updateSessionTitle,
    loadMoreMessages,
    refreshSessions
  } = useChat({ 
    knowledgeBaseId: selectedKnowledgeBase,
    autoLoadSessions: true 
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };
  
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: 显示复制成功提示
  };

  const startNewChat = async () => {
    if (!selectedKnowledgeBase) {
      alert('请先选择一个知识库');
      return;
    }
    
    try {
      await createSession('新对话', selectedKnowledgeBase);
    } catch (error) {
      console.error('创建新对话失败:', error);
    }
  };
  
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个对话吗？')) {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('删除对话失败:', error);
      }
    }
  };
  
  const handleEditTitle = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };
  
  const handleSaveTitle = async () => {
    if (editingSessionId && editingTitle.trim()) {
      try {
        await updateSessionTitle(editingSessionId, editingTitle.trim());
        setEditingSessionId(null);
        setEditingTitle('');
      } catch (error) {
        console.error('更新标题失败:', error);
      }
    }
  };
  
  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 初始化选择第一个知识库
  useEffect(() => {
    if (knowledgeBases.length > 0 && !selectedKnowledgeBase) {
      setSelectedKnowledgeBase(knowledgeBases[0].id);
    }
  }, [knowledgeBases, selectedKnowledgeBase]);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewChat}
            disabled={!selectedKnowledgeBase}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            新建对话
          </button>
        </div>

        {/* Knowledge Base Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择知识库
          </label>
          <select
            value={selectedKnowledgeBase}
            onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
            disabled={isLoadingKB}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">请选择知识库</option>
            {knowledgeBases.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">对话历史</h3>
              {hasMoreMessages && (
                <button
                  onClick={loadMoreMessages}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  disabled={isLoading}
                >
                  加载更多
                </button>
              )}
            </div>
            
            {isLoading && sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">加载中...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">暂无对话历史</div>
                <div className="text-xs text-gray-400 mt-1">点击上方按钮开始新对话</div>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => switchSession(session.id)}
                      className="w-full text-left p-3 rounded-lg"
                    >
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={handleTitleKeyPress}
                          onBlur={handleSaveTitle}
                          className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {session.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(session.createdAt)}
                      </div>
                    </button>
                    
                    {/* Session Actions */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button
                        onClick={(e) => handleEditTitle(session.id, session.title, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="编辑标题"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="删除对话"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">AI 问答对话</h1>
          <p className="text-sm text-gray-600 mt-1">
            {currentSession ? (
              `当前对话：${currentSession.title}`
            ) : (
              '请选择或创建一个对话'
            )}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl flex ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 ${
                      message.role === 'user' ? 'ml-3' : 'mr-3'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <p className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>
                        {message.content}
                      </p>
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-600 mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          参考来源
                        </div>
                        <div className="space-y-2">
                          {message.sources.map((source) => (
                            <div
                              key={source.chunkId}
                              className="bg-gray-50 rounded-lg p-3 text-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {source.documentTitle}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800">
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-gray-700 text-xs leading-relaxed">
                                {source.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="复制回答"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="有用"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="无用"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!currentSession && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">开始新的对话</h3>
                <p className="text-gray-500 mb-6">选择一个知识库，然后创建新对话开始提问</p>
                <button
                  onClick={startNewChat}
                  disabled={!selectedKnowledgeBase}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  创建新对话
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentSession ? "输入您的问题...（按 Enter 发送，Shift + Enter 换行）" : "请先选择或创建一个对话"}
                  rows={1}
                  disabled={!currentSession || isSending}
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending || !currentSession}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex-shrink-0"
                title={!currentSession ? "请先选择或创建一个对话" : "发送消息"}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}