-- 启用 pgvector 扩展并更新表结构

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为 documents 表添加缺失的字段
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加外键约束（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_user_id_fkey' 
    AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 更新 file_size 字段类型为 BIGINT
ALTER TABLE documents ALTER COLUMN file_size TYPE BIGINT;

-- 更新 status 字段的约束，添加 'pending' 状态
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- 为 knowledge_bases 表添加缺失的字段
ALTER TABLE knowledge_bases 
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;

-- 为 document_chunks 表添加缺失的字段
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536), -- OpenAI embedding dimension
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 移除不需要的 vector_id 字段
ALTER TABLE document_chunks DROP COLUMN IF EXISTS vector_id;

-- 为 chat_messages 表添加 'system' 角色支持
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_role_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_role_check 
  CHECK (role IN ('user', 'assistant', 'system'));

-- 创建任务队列表（如果不存在）
CREATE TABLE IF NOT EXISTS task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_knowledge_base_id ON documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON task_queue(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id ON knowledge_bases(user_id);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
DROP TRIGGER IF EXISTS update_knowledge_bases_updated_at ON knowledge_bases;
CREATE TRIGGER update_knowledge_bases_updated_at 
  BEFORE UPDATE ON knowledge_bases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_queue_updated_at ON task_queue;
CREATE TRIGGER update_task_queue_updated_at 
  BEFORE UPDATE ON task_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：更新知识库文档数量
CREATE OR REPLACE FUNCTION update_knowledge_base_document_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_bases 
    SET document_count = document_count + 1 
    WHERE id = NEW.knowledge_base_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_bases 
    SET document_count = document_count - 1 
    WHERE id = OLD.knowledge_base_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 为文档表添加触发器，自动更新知识库文档数量
DROP TRIGGER IF EXISTS update_kb_doc_count_on_insert ON documents;
CREATE TRIGGER update_kb_doc_count_on_insert 
  AFTER INSERT ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_document_count();

DROP TRIGGER IF EXISTS update_kb_doc_count_on_delete ON documents;
CREATE TRIGGER update_kb_doc_count_on_delete 
  AFTER DELETE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_base_document_count();