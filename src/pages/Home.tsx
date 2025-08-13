import { ArrowRight, FileText, MessageSquare, Brain, Users, Shield, Zap, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Home() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('已成功退出登录');
    } catch (error) {
      toast.error('退出登录失败');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">AI 文档问答知识库</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.name || user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">退出</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            智能文档问答，
            <span className="text-blue-600">让知识触手可及</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            基于大语言模型和检索增强生成技术，将传统文档管理转变为智能化的知识问答体验。
            上传文档，即问即答，让信息检索变得前所未有的简单高效。
          </p>
          <div className="flex justify-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/knowledge-base"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center"
                >
                  管理知识库
                  <Brain className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/chat"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center"
                >
                  开始问答
                  <MessageSquare className="ml-2 h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center"
                >
                  免费开始使用
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/demo"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  查看演示
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">核心功能特性</h3>
            <p className="text-lg text-gray-600">强大的AI技术，简单的操作体验</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">智能文档解析</h4>
              <p className="text-gray-600">
                支持PDF、Word、Markdown等多种格式，自动提取文本内容并进行语义分析和向量化处理。
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <MessageSquare className="h-12 w-12 text-green-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">自然语言问答</h4>
              <p className="text-gray-600">
                使用自然语言提问，AI理解语义并从文档中检索相关信息，生成准确、有用的答案。
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl">
              <Brain className="h-12 w-12 text-purple-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">检索增强生成</h4>
              <p className="text-gray-600">
                结合语义检索和大语言模型，确保答案既准确又相关，并提供原文引用来源。
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <Users className="h-12 w-12 text-orange-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">团队协作</h4>
              <p className="text-gray-600">
                支持创建团队知识库，邀请成员协作，设置访问权限，实现知识共享。
              </p>
            </div>
            <div className="bg-red-50 p-6 rounded-xl">
              <Shield className="h-12 w-12 text-red-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">安全可靠</h4>
              <p className="text-gray-600">
                企业级安全保障，数据加密存储，支持私有部署，确保您的数据安全。
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl">
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">快速响应</h4>
              <p className="text-gray-600">
                毫秒级语义检索，秒级答案生成，让您的知识查询体验如丝般顺滑。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">使用流程</h3>
            <p className="text-lg text-gray-600">三步开始，轻松上手</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">上传文档</h4>
              <p className="text-gray-600">
                将您的PDF、Word或其他格式文档上传到知识库，系统自动解析和索引。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">提出问题</h4>
              <p className="text-gray-600">
                使用自然语言描述您的问题，AI会理解您的意图并搜索相关内容。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">获得答案</h4>
              <p className="text-gray-600">
                获得准确的答案和原文引用，支持多轮对话，深入探讨问题。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            准备好体验智能文档问答了吗？
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            立即注册，免费开始使用，让AI成为您的知识助手
          </p>
          {isAuthenticated ? (
            <Link
              to="/knowledge-base"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center"
            >
              进入知识库
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center"
            >
              立即开始
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Brain className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-lg font-semibold">AI 文档问答</span>
              </div>
              <p className="text-gray-400">
                让知识触手可及，让问答更加智能。
              </p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">产品</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">功能特性</Link></li>
                <li><Link to="/pricing" className="hover:text-white">价格方案</Link></li>
                <li><Link to="/demo" className="hover:text-white">产品演示</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">支持</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/docs" className="hover:text-white">使用文档</Link></li>
                <li><Link to="/help" className="hover:text-white">帮助中心</Link></li>
                <li><Link to="/contact" className="hover:text-white">联系我们</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">公司</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">关于我们</Link></li>
                <li><Link to="/privacy" className="hover:text-white">隐私政策</Link></li>
                <li><Link to="/terms" className="hover:text-white">服务条款</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI 文档问答知识库. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}