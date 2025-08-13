import { supabaseAdmin } from '../lib/supabase';
import type { Task } from '../../shared/types';

// 任务类型枚举
export enum TaskType {
  DOCUMENT_PROCESSING = 'document_processing',
  DOCUMENT_REPROCESSING = 'document_reprocessing'
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

// 添加文档处理任务
export function addDocumentProcessingTask(documentId: string, priority: number = TaskPriority.NORMAL): string {
  const taskId = generateTaskId();
  
  // 这里暂时使用内存队列，后续可以改为数据库队列
  const task = {
    id: taskId,
    type: TaskType.DOCUMENT_PROCESSING,
    payload: { documentId },
    priority,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  
  // 异步处理任务
  setTimeout(() => {
    processDocumentTask(task);
  }, 1000);
  
  return taskId;
}

// 添加文档重新处理任务
export function addDocumentReprocessingTask(documentId: string, priority: number = TaskPriority.HIGH): string {
  const taskId = generateTaskId();
  
  const task = {
    id: taskId,
    type: TaskType.DOCUMENT_REPROCESSING,
    payload: { documentId },
    priority,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  
  // 异步处理任务
  setTimeout(() => {
    processDocumentTask(task);
  }, 1000);
  
  return taskId;
}

// 生成任务ID
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 处理文档任务
async function processDocumentTask(task: any): Promise<void> {
  try {
    console.log(`开始处理任务: ${task.id}, 类型: ${task.type}`);
    
    const { documentId } = task.payload;
    
    // 更新文档状态为处理中
    await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'processing',
        processing_progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    // 模拟文档处理过程
    await simulateDocumentProcessing(documentId);
    
    // 更新文档状态为完成
    await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'completed',
        processing_progress: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    console.log(`任务完成: ${task.id}`);
  } catch (error) {
    console.error(`任务处理失败: ${task.id}`, error);
    
    // 更新文档状态为失败
    await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : '处理失败',
        updated_at: new Date().toISOString()
      })
      .eq('id', task.payload.documentId);
  }
}

// 模拟文档处理过程
async function simulateDocumentProcessing(documentId: string): Promise<void> {
  // 获取文档信息
  const { data: document, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();
  
  if (error || !document) {
    throw new Error('文档不存在');
  }
  
  console.log(`处理文档: ${document.title}`);
  
  // 模拟处理步骤
  const steps = [
    { name: '文件解析', progress: 20 },
    { name: '内容提取', progress: 40 },
    { name: '文本分块', progress: 60 },
    { name: '向量化', progress: 80 },
    { name: '索引构建', progress: 100 }
  ];
  
  for (const step of steps) {
    console.log(`${step.name}...`);
    
    // 更新处理进度
    await supabaseAdmin
      .from('documents')
      .update({ 
        processing_progress: step.progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 模拟生成文档块
  await generateDocumentChunks(documentId, document.title);
}

// 生成文档块（模拟）
async function generateDocumentChunks(documentId: string, documentTitle: string): Promise<void> {
  const chunks = [
    {
      document_id: documentId,
      content: `这是文档"${documentTitle}"的第一个文本块。包含了文档的主要概述和介绍内容。`,
      chunk_index: 0,
      token_count: 50,
      embedding: null, // 实际应用中这里会是向量数据
      metadata: { section: 'introduction', page: 1 }
    },
    {
      document_id: documentId,
      content: `这是文档"${documentTitle}"的第二个文本块。包含了详细的技术说明和实现细节。`,
      chunk_index: 1,
      token_count: 45,
      embedding: null,
      metadata: { section: 'technical_details', page: 2 }
    },
    {
      document_id: documentId,
      content: `这是文档"${documentTitle}"的第三个文本块。包含了总结和结论部分的内容。`,
      chunk_index: 2,
      token_count: 40,
      embedding: null,
      metadata: { section: 'conclusion', page: 3 }
    }
  ];
  
  // 插入文档块
  const { error } = await supabaseAdmin
    .from('document_chunks')
    .insert(chunks);
  
  if (error) {
    console.error('文档块插入失败:', error);
    throw new Error('文档块生成失败');
  }
  
  // 更新文档的块数量
  await supabaseAdmin
    .from('documents')
    .update({ 
      chunk_count: chunks.length,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId);
  
  console.log(`生成了 ${chunks.length} 个文档块`);
}

// 获取任务状态（预留接口）
export async function getTaskStatus(taskId: string): Promise<Task | null> {
  // 这里可以从数据库查询任务状态
  // 目前返回null，表示任务已完成或不存在
  return null;
}

// 清理过期任务（预留接口）
export async function cleanupExpiredTasks(): Promise<void> {
  // 清理超过24小时的已完成任务
  console.log('清理过期任务...');
}