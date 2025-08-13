# 数据库初始化指南

本文档说明如何初始化AI文档问答知识库项目的数据库。

## 前置条件

1. 已安装并配置好Supabase项目
2. 已获取Supabase项目的URL和API密钥
3. 已配置环境变量

## 环境变量配置

复制 `.env.example` 文件为 `.env`，并填入正确的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下配置：

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_make_it_different_and_long
```

## 数据库初始化步骤

### 1. 运行数据库迁移

项目使用Supabase作为数据库，迁移文件位于 `supabase/migrations/` 目录。

```bash
# 应用数据库迁移
pnpm run db:migrate
```

或者手动在Supabase控制台执行SQL：

```sql
-- 执行 supabase/migrations/001_initial_schema.sql 中的SQL语句
```

### 2. 验证数据库结构

迁移完成后，数据库应包含以下表：

- `users` - 用户表
- `knowledge_bases` - 知识库表
- `documents` - 文档表
- `chat_sessions` - 对话会话表
- `chat_messages` - 对话消息表

### 3. 配置行级安全策略（RLS）

数据库迁移会自动启用RLS并创建相应的安全策略，确保：

- 用户只能访问自己的数据
- 公开知识库可被所有用户访问
- 对话记录仅对会话所有者可见

### 4. 权限配置

确保为 `anon` 和 `authenticated` 角色分配了正确的权限：

```sql
-- 检查权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
```

## 测试数据库连接

启动后端服务并测试数据库连接：

```bash
# 启动后端API服务
pnpm run dev:api

# 测试健康检查接口
curl http://localhost:3001/api/health
```

## 常见问题

### 1. 权限错误

如果遇到 "permission denied for table" 错误：

```sql
-- 为anon角色授权（未登录用户）
GRANT SELECT ON table_name TO anon;

-- 为authenticated角色授权（已登录用户）
GRANT ALL PRIVILEGES ON table_name TO authenticated;
```

### 2. 连接失败

检查环境变量配置是否正确：
- SUPABASE_URL 格式：`https://your-project.supabase.co`
- API密钥是否有效
- 网络连接是否正常

### 3. 迁移失败

如果迁移失败，可以：
1. 检查SQL语法是否正确
2. 确认Supabase项目状态正常
3. 手动在Supabase控制台执行SQL

## 备份与恢复

### 备份

```bash
# 使用Supabase CLI备份
supabase db dump --file backup.sql
```

### 恢复

```bash
# 恢复数据库
supabase db reset
supabase db push
```

## 相关文档

- [Supabase官方文档](https://supabase.com/docs)
- [项目API文档](../api/API.md)
- [环境配置说明](../../.env.example)