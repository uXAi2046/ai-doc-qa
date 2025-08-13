// Supabase 配置文件

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

// 验证必要的环境变量
if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.serviceRoleKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// 前端使用的配置（只包含 URL 和 anon key）
export const clientConfig = {
  url: supabaseConfig.url,
  anonKey: supabaseConfig.anonKey
};

// 后端使用的配置（包含 service role key）
export const serverConfig = {
  url: supabaseConfig.url,
  serviceRoleKey: supabaseConfig.serviceRoleKey
};