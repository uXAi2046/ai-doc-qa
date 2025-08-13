import type { 
  ApiResponse, 
  PaginatedResponse, 
  ChatSession, 
  ChatMessage, 
  CreateChatSessionRequest, 
  SendMessageRequest 
} from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// API客户端类
class ApiClient {
  public baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth API methods
  async register(data: { name: string; email: string; password: string }): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request<any>('/auth/me');
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  // Chat API methods
  async createChatSession(request: CreateChatSessionRequest): Promise<ApiResponse<ChatSession>> {
    return this.request<ChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChatSessions(
    page = 1,
    limit = 20,
    knowledgeBaseId?: string
  ): Promise<ApiResponse<PaginatedResponse<ChatSession>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (knowledgeBaseId) {
      params.append('knowledgeBaseId', knowledgeBaseId);
    }

    return this.request<PaginatedResponse<ChatSession>>(`/chat/sessions?${params}`);
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return this.request<ChatSession>(`/chat/sessions/${sessionId}`);
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async getChatMessages(
    sessionId: string,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<PaginatedResponse<ChatMessage>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<PaginatedResponse<ChatMessage>>(
      `/chat/sessions/${sessionId}/messages?${params}`
    );
  }

  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<ChatMessage[]>> {
    return this.request<ChatMessage[]>(`/chat/sessions/${request.sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: request.content }),
    });
  }

  async updateSessionTitle(
    sessionId: string,
    title: string
  ): Promise<ApiResponse<{ id: string; title: string }>> {
    return this.request<{ id: string; title: string }>(`/chat/sessions/${sessionId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// 导出便捷方法
export const authApi = {
  register: (data: { name: string; email: string; password: string }) => apiClient.register(data),
  login: (data: { email: string; password: string }) => apiClient.login(data),
  getCurrentUser: () => apiClient.getCurrentUser(),
  logout: () => apiClient.logout(),
  setToken: (token: string) => apiClient.setToken(token),
  clearToken: () => apiClient.clearToken(),
};

export const chatApi = {
  createSession: (request: CreateChatSessionRequest) => apiClient.createChatSession(request),
  getSessions: (page?: number, limit?: number, knowledgeBaseId?: string) => 
    apiClient.getChatSessions(page, limit, knowledgeBaseId),
  getSession: (sessionId: string) => apiClient.getChatSession(sessionId),
  deleteSession: (sessionId: string) => apiClient.deleteChatSession(sessionId),
  getMessages: (sessionId: string, page?: number, limit?: number) => 
    apiClient.getChatMessages(sessionId, page, limit),
  sendMessage: (request: SendMessageRequest) => apiClient.sendMessage(request),
  updateSessionTitle: (sessionId: string, title: string) => 
    apiClient.updateSessionTitle(sessionId, title),
};

export default apiClient;