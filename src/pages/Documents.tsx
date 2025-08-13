import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, Download, Search, Filter, Plus, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import type { Document } from '../../shared/types';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

export default function Documents() {
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // 使用文档管理Hook
  const {
    documents,
    loading,
    uploading,
    error,
    pagination,
    uploadProgress,
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    reprocessDocument,
    searchDocuments,
    filterByStatus,
    filterByKnowledgeBase,
    goToPage,
    clearError,
    refreshDocuments
  } = useDocuments();

  // 模拟知识库数据（实际应该从API获取）
  const knowledgeBases: KnowledgeBase[] = [
    { id: '1', name: '技术文档', description: '技术相关文档', documentCount: 15 },
    { id: '2', name: '产品手册', description: '产品使用手册', documentCount: 8 },
    { id: '3', name: '法律文件', description: '合同和法律文档', documentCount: 5 }
  ];

  // 处理搜索和过滤
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchDocuments(searchTerm);
      } else {
        refreshDocuments();
      }
    }, 300); // 防抖

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    filterByStatus(filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    filterByKnowledgeBase(selectedKnowledgeBase);
  }, [selectedKnowledgeBase]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // 检查是否选择了知识库
    if (selectedKnowledgeBase === 'all') {
      alert('请先选择一个知识库');
      return;
    }
    
    clearError();
    
    try {
      const fileArray = Array.from(files);
      
      if (fileArray.length === 1) {
        // 单文件上传
        await uploadDocument({
          file: fileArray[0],
          knowledgeBaseId: selectedKnowledgeBase,
          title: fileArray[0].name
        });
      } else {
        // 多文件上传
        await uploadMultipleDocuments(fileArray, selectedKnowledgeBase);
      }
      
      console.log('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // 处理文档删除
  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      try {
        await deleteDocument(documentId);
        console.log('文档删除成功');
      } catch (error) {
        console.error('文档删除失败:', error);
      }
    }
  };

  // 处理文档重新处理
  const handleReprocessDocument = async (documentId: string) => {
    try {
      await reprocessDocument(documentId);
      console.log('文档重新处理已开始');
    } catch (error) {
      console.error('文档重新处理失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">文档管理</h1>
              <p className="text-gray-600 mt-1">管理您的文档和知识库</p>
              {error && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{error}</span>
                  <button 
                    onClick={clearError}
                    className="ml-2 text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshDocuments}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                新建知识库
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Knowledge Bases */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">知识库</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedKnowledgeBase('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedKnowledgeBase === 'all'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    <span>全部文档</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {documents.length} 个文档
                  </div>
                </button>
                {knowledgeBases.map((kb) => (
                  <button
                    key={kb.id}
                    onClick={() => setSelectedKnowledgeBase(kb.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedKnowledgeBase === kb.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      <span>{kb.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      {kb.documentCount} 个文档
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Upload Area */}
            <div
              className={`bg-white rounded-lg border-2 border-dashed p-8 text-center mb-6 transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {uploading ? '正在上传...' : '拖拽文件到此处或点击上传'}
              </h3>
              <p className="text-gray-600 mb-4">
                支持 PDF、Word、Markdown、TXT 等格式，单个文件最大 10MB
              </p>
              
              {/* 上传进度 */}
              {uploadProgress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>上传进度: {uploadProgress.completed}/{uploadProgress.total}</span>
                    <span>{Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  {uploadProgress.currentFile && (
                    <p className="text-sm text-gray-500 mt-1">当前文件: {uploadProgress.currentFile}</p>
                  )}
                </div>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.md,.txt"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`px-6 py-2 rounded-lg cursor-pointer inline-flex items-center transition-colors ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? '上传中...' : '选择文件'}
              </label>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索文档..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部状态</option>
                    <option value="completed">已完成</option>
                    <option value="processing">处理中</option>
                    <option value="failed">失败</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    文档列表 ({pagination.total})
                  </h3>
                  {loading && (
                    <div className="flex items-center text-gray-500">
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      <span className="text-sm">加载中...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {loading && documents.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">加载中...</h3>
                    <p className="text-gray-600">正在获取文档列表</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文档</h3>
                    <p className="text-gray-600">上传您的第一个文档开始使用</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {doc.title}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{doc.title}</span>
                              <span className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</span>
                              <span className="text-sm text-gray-500">{formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(doc.status)
                            }`}
                          >
                            {getStatusText(doc.status)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {doc.status === 'failed' && (
                              <button 
                                onClick={() => handleReprocessDocument(doc.id)}
                                className="text-gray-400 hover:text-orange-600 transition-colors"
                                title="重新处理"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="下载文件"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="删除文档"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 分页 */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      显示 {(pagination.page - 1) * pagination.limit + 1} 到{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                      共 {pagination.total} 条记录
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      <span className="text-sm text-gray-700">
                        第 {pagination.page} 页，共 {pagination.totalPages} 页
                      </span>
                      <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}