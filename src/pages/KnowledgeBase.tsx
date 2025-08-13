import { useState } from 'react';
import { Plus, Settings, Users, Share2, Eye, Edit, Trash2, Search, Filter, Globe, Lock, UserPlus } from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'public' | 'shared';
  documentCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  owner: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export default function KnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([
    {
      id: '1',
      name: '技术文档',
      description: '包含所有技术相关的文档和资料',
      visibility: 'private',
      documentCount: 15,
      memberCount: 3,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      owner: '张三'
    },
    {
      id: '2',
      name: '产品手册',
      description: '产品使用说明和操作指南',
      visibility: 'shared',
      documentCount: 8,
      memberCount: 5,
      createdAt: '2024-01-12T09:15:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      owner: '李四'
    },
    {
      id: '3',
      name: '公开知识库',
      description: '面向所有用户开放的知识库',
      visibility: 'public',
      documentCount: 25,
      memberCount: 12,
      createdAt: '2024-01-08T15:20:00Z',
      updatedAt: '2024-01-15T11:10:00Z',
      owner: '王五'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [newKnowledgeBase, setNewKnowledgeBase] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'private' | 'public' | 'shared'
  });

  const members: Member[] = [
    {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      role: 'owner',
      joinedAt: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      role: 'admin',
      joinedAt: '2024-01-11T14:30:00Z'
    },
    {
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      role: 'member',
      joinedAt: '2024-01-12T09:15:00Z'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'shared':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-gray-600" />;
      default:
        return <Lock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '公开';
      case 'shared':
        return '共享';
      case 'private':
        return '私有';
      default:
        return '私有';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return '所有者';
      case 'admin':
        return '管理员';
      case 'member':
        return '成员';
      case 'viewer':
        return '查看者';
      default:
        return '成员';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    const matchesSearch = kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kb.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = filterVisibility === 'all' || kb.visibility === filterVisibility;
    
    return matchesSearch && matchesVisibility;
  });

  const handleCreateKnowledgeBase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: 实现创建知识库的API调用
      const newKb: KnowledgeBase = {
        id: Date.now().toString(),
        ...newKnowledgeBase,
        documentCount: 0,
        memberCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: '当前用户'
      };
      
      setKnowledgeBases(prev => [newKb, ...prev]);
      setNewKnowledgeBase({ name: '', description: '', visibility: 'private' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('创建知识库失败:', error);
    }
  };

  const handleDeleteKnowledgeBase = async (id: string) => {
    if (window.confirm('确定要删除这个知识库吗？此操作不可恢复。')) {
      try {
        // TODO: 实现删除知识库的API调用
        setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));
      } catch (error) {
        console.error('删除知识库失败:', error);
      }
    }
  };

  const showMembers = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb);
    setShowMembersModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
              <p className="text-gray-600 mt-1">创建和管理您的知识库</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建知识库
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索知识库..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                <option value="private">私有</option>
                <option value="shared">共享</option>
                <option value="public">公开</option>
              </select>
            </div>
          </div>
        </div>

        {/* Knowledge Bases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledgeBases.map((kb) => (
            <div key={kb.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{kb.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{kb.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    {getVisibilityIcon(kb.visibility)}
                    <span className="text-xs text-gray-500">{getVisibilityText(kb.visibility)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{kb.documentCount} 个文档</span>
                  <span>{kb.memberCount} 个成员</span>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  <div>创建于 {formatDate(kb.createdAt)}</div>
                  <div>更新于 {formatDate(kb.updatedAt)}</div>
                  <div>所有者：{kb.owner}</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => showMembers(kb)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="管理成员"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-green-600 transition-colors"
                      title="分享"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="查看"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="删除"
                      onClick={() => handleDeleteKnowledgeBase(kb.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredKnowledgeBases.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无知识库</h3>
            <p className="text-gray-600 mb-4">创建您的第一个知识库开始使用</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              新建知识库
            </button>
          </div>
        )}
      </div>

      {/* Create Knowledge Base Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">创建新知识库</h2>
            <form onSubmit={handleCreateKnowledgeBase}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    知识库名称
                  </label>
                  <input
                    type="text"
                    required
                    value={newKnowledgeBase.name}
                    onChange={(e) => setNewKnowledgeBase(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入知识库名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={newKnowledgeBase.description}
                    onChange={(e) => setNewKnowledgeBase(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="请输入知识库描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    可见性
                  </label>
                  <select
                    value={newKnowledgeBase.visibility}
                    onChange={(e) => setNewKnowledgeBase(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="private">私有 - 仅您可以访问</option>
                    <option value="shared">共享 - 邀请的成员可以访问</option>
                    <option value="public">公开 - 所有人都可以访问</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedKnowledgeBase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedKnowledgeBase.name} - 成员管理
              </h2>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                邀请成员
              </button>
            </div>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div className="text-xs text-gray-400">加入于 {formatDate(member.joinedAt)}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {getRoleText(member.role)}
                    </span>
                    {member.role !== 'owner' && (
                      <button className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}