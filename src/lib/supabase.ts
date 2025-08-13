// Supabase 客户端配置

import { createClient } from '@supabase/supabase-js';
import { clientConfig } from '../../supabase/config';

// 创建 Supabase 客户端实例
export const supabase = createClient(clientConfig.url, clientConfig.anonKey);

// 导出类型
export type { User } from '@supabase/supabase-js';