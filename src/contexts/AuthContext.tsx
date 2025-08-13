import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 检查本地存储的token并验证用户
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // 验证token并获取用户信息
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // token无效，清除本地存储
        localStorage.removeItem('token');
        authApi.clearToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // token无效，清除本地存储
      localStorage.removeItem('token');
      authApi.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // 登录函数
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        // 保存token
        authApi.setToken(response.data.token);
        // 设置用户信息
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || '登录失败' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: '登录失败，请稍后重试' };
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清除本地状态和存储
      setUser(null);
      authApi.clearToken();
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;