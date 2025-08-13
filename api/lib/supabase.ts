// 后端 Supabase 客户端配置

import { createClient } from '@supabase/supabase-js';
import { serverConfig } from '../../supabase/config';

// 创建具有 service role 权限的 Supabase 客户端实例
export const supabaseAdmin = createClient(serverConfig.url, serverConfig.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 创建普通权限的 Supabase 客户端实例（用于需要用户认证的操作）
export const supabase = createClient(serverConfig.url, serverConfig.serviceRoleKey);

// 导出类型
export type { User } from '@supabase/supabase-js';