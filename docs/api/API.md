# AI文档问答知识库 API文档

## 概述

本文档描述了AI文档问答知识库项目的RESTful API接口。

**基础URL**: `http://localhost:3001/api`

**版本**: v1.0.0

## 认证

### JWT认证

大部分API需要JWT令牌认证。在请求头中包含：

```
Authorization: Bearer <your_jwt_token>
```

### 获取令牌

通过登录接口获取访问令牌和刷新令牌。

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## API接口

### 1. 用户认证

#### 1.1 用户注册

**POST** `/auth/register`

**请求体**:
```json
{
  "name": "用户姓名",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "用户姓名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 1.2 用户登录

**POST** `/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**: 同注册接口

#### 1.3 刷新令牌

**POST** `/auth/refresh`

**请求体**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### 1.4 用户登出

**POST** `/auth/logout`

**Headers**: `Authorization: Bearer <token>`

### 2. 知识库管理

#### 2.1 获取知识库列表

**GET** `/knowledge-bases`

**Headers**: `Authorization: Bearer <token>`

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `search`: 搜索关键词
- `visibility`: 可见性筛选（public/private）

**响应**:
```json
{
  "success": true,
  "data": {
    "knowledgeBases": [
      {
        "id": "uuid",
        "name": "知识库名称",
        "description": "描述",
        "visibility": "private",
        "ownerId": "uuid",
        "documentsCount": 5,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### 2.2 创建知识库

**POST** `/knowledge-bases`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "name": "新知识库",
  "description": "知识库描述",
  "visibility": "private"
}
```

#### 2.3 更新知识库

**PUT** `/knowledge-bases/:id`

**Headers**: `Authorization: Bearer <token>`

#### 2.4 删除知识库

**DELETE** `/knowledge-bases/:id`

**Headers**: `Authorization: Bearer <token>`

### 3. 文档管理

#### 3.1 获取文档列表

**GET** `/documents`

**Headers**: `Authorization: Bearer <token>`

**查询参数**:
- `knowledgeBaseId`: 知识库ID
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词
- `status`: 状态筛选

#### 3.2 上传文档

**POST** `/documents/upload`

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**请求体**:
- `file`: 文件（支持PDF、DOC、DOCX、TXT、MD）
- `knowledgeBaseId`: 知识库ID
- `title`: 文档标题（可选）

#### 3.3 删除文档

**DELETE** `/documents/:id`

**Headers**: `Authorization: Bearer <token>`

### 4. 对话管理

#### 4.1 创建对话会话

**POST** `/chat/sessions`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "title": "对话标题",
  "knowledgeBaseId": "uuid"
}
```

#### 4.2 获取对话历史

**GET** `/chat/sessions`

**Headers**: `Authorization: Bearer <token>`

#### 4.3 发送消息

**POST** `/chat/sessions/:sessionId/messages`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "content": "用户问题",
  "knowledgeBaseId": "uuid"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "uuid",
      "role": "user",
      "content": "用户问题",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "assistantMessage": {
      "id": "uuid",
      "role": "assistant",
      "content": "AI回答",
      "metadata": {
        "sources": [
          {
            "documentId": "uuid",
            "title": "文档标题",
            "excerpt": "相关片段"
          }
        ]
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 错误码

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| INVALID_CREDENTIALS | 401 | 无效的登录凭据 |
| TOKEN_EXPIRED | 401 | 令牌已过期 |
| INSUFFICIENT_PERMISSIONS | 403 | 权限不足 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| FILE_TOO_LARGE | 413 | 文件过大 |
| UNSUPPORTED_FILE_TYPE | 415 | 不支持的文件类型 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

## 限制说明

### 文件上传限制

- 最大文件大小：10MB
- 支持格式：PDF、DOC、DOCX、TXT、MD
- 单次最多上传1个文件

### 请求频率限制

- 每个IP每15分钟最多100个请求
- 认证用户限制更宽松

### 数据限制

- 知识库名称：最长255字符
- 文档标题：最长255字符
- 对话消息：最长10000字符

## 示例代码

### JavaScript/TypeScript

```typescript
// 登录示例
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const result = await response.json();
  if (result.success) {
    localStorage.setItem('token', result.data.token);
    return result.data.user;
  }
  throw new Error(result.error);
};

// 发送消息示例
const sendMessage = async (sessionId: string, content: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  
  return response.json();
};
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现用户认证功能
- 实现知识库管理功能
- 实现文档管理功能
- 实现基础对话功能

## 联系方式

如有问题或建议，请联系开发团队。