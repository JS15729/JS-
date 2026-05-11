<template>
  <el-dialog v-model="dialogVisible" title="上传文件" width="600px" @close="handleClose" class="upload-dialog">
    <!-- 拖拽上传区域 -->
    <div class="upload-area" :class="{ dragging: isDragging, 'has-files': uploadQueue.length > 0 }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="isDragging = true"
      @dragleave="onDragLeave"
      @drop.prevent="handleDrop">
      <div class="upload-visual">
        <div class="upload-icon-ring" :class="{ pulsing: isDragging }">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" :stroke="isDragging ? '#6366f1' : '#94a3b8'" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="upload-text">
          <p class="upload-title">{{ isDragging ? '释放以上传文件' : '拖拽文件到此处上传' }}</p>
          <p class="upload-hint">支持任意格式 · 单文件最大10GB · 大文件自动分片</p>
        </div>
        <input type="file" ref="fileInput" multiple @change="handleFileSelect" style="display:none" />
        <el-button type="primary" @click="($refs.fileInput as HTMLInputElement).click()" class="btn-gradient">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          选择文件
        </el-button>
      </div>
    </div>

    <!-- 上传队列 -->
    <div class="upload-queue" v-if="uploadQueue.length > 0">
      <div v-for="item in uploadQueue" :key="item.id" class="upload-item" :class="{ 'upload-done': item.status === 'done', 'upload-error': item.status === 'error' }">
        <div class="item-info">
          <div class="item-icon" :class="item.status">
            <svg v-if="item.status === 'done'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else-if="item.status === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
          </div>
          <span class="item-name">{{ item.name }}</span>
          <span class="item-size">{{ formatFileSize(item.size) }}</span>
        </div>
        <el-progress
          :percentage="item.progress"
          :status="item.status === 'error' ? 'exception' : item.status === 'done' ? 'success' : ''"
          :stroke-width="6"
          :show-text="item.status === 'uploading' || item.status === 'merging'"
        />
        <span class="item-status" :class="item.status">
          <template v-if="item.status === 'hashing'">计算文件哈希...</template>
          <template v-else-if="item.status === 'uploading'">上传中 ({{ item.uploaded }}/{{ item.total }} 分片)</template>
          <template v-else-if="item.status === 'merging'">合并分片中...</template>
          <template v-else-if="item.status === 'done'">上传完成</template>
          <template v-else-if="item.status === 'error'">{{ item.error }}</template>
          <template v-else>等待上传...</template>
        </span>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false" :disabled="isUploading">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadApi } from '@/api'
import { formatFileSize } from '@/utils'

const props = defineProps<{ visible: boolean; folderId?: string }>()
const emit = defineEmits(['update:visible', 'success'])

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 分片

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const uploadQueue = ref<any[]>([])

const isUploading = computed(() => uploadQueue.value.some((item: any) => item.status === 'uploading' || item.status === 'merging' || item.status === 'hashing'))

let dragCounter = 0
function onDragEnter(e: DragEvent) {
  dragCounter++
  isDragging.value = true
}
function onDragLeave(e: DragEvent) {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragging.value = false
  }
}

function handleDrop(event: DragEvent) {
  dragCounter = 0
  isDragging.value = false
  const items = event.dataTransfer?.items
  if (items) {
    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    addToQueue(files)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addToQueue(Array.from(target.files))
    target.value = ''
  }
}

async function addToQueue(files: File[]) {
  for (const file of files) {
    const id = Date.now() + '_' + Math.random().toString(36).slice(2)
    const queueItem = {
      id,
      name: file.name,
      size: file.size,
      progress: 0,
      status: file.size > 10 * 1024 * 1024 ? 'hashing' : 'pending', // 大文件需要哈希
      uploaded: 0,
      total: 0,
      error: '',
      file,
    }
    uploadQueue.value.push(queueItem)

    if (file.size > 10 * 1024 * 1024) {
      // 大文件分片上传
      await chunkedUpload(queueItem)
    } else {
      // 小文件直接上传
      await simpleUpload(queueItem)
    }
  }

  if (uploadQueue.value.every((item: any) => item.status === 'done')) {
    ElMessage.success('全部上传完成')
    emit('success')
  }
}

async function computeHash(file: File): Promise<string> {
  try {
    // @ts-ignore
    const SparkMD5 = (await import('spark-md5')).default
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    const chunkSize = 2 * 1024 * 1024 // 2MB for hash
    let offset = 0

    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize)
      const buffer = await new Promise<ArrayBuffer>((resolve) => {
        reader.onload = (e) => resolve(e.target!.result as ArrayBuffer)
        reader.readAsArrayBuffer(slice)
      })
      spark.append(buffer)
      offset += chunkSize
    }

    return spark.end()
  } catch (e) {
    // fallback: use file name + size + timestamp
    return `${file.name}_${file.size}_${file.lastModified}`
  }
}

async function simpleUpload(item: any) {
  item.status = 'uploading'
  item.progress = 30

  try {
    const formData = new FormData()
    formData.append('file', item.file)
    if (props.folderId) formData.append('folder_id', props.folderId)

    await uploadApi.simple(formData)
    item.status = 'done'
    item.progress = 100
  } catch (e: any) {
    item.status = 'error'
    item.error = e.response?.data?.message || '上传失败'
  }
}

async function chunkedUpload(item: any) {
  item.status = 'hashing'
  const hash = await computeHash(item.file)
  const totalChunks = Math.ceil(item.file.size / CHUNK_SIZE)

  item.status = 'uploading'
  item.total = totalChunks

  try {
    // 1. 初始化上传
    const initRes: any = await uploadApi.init({
      file_name: item.file.name,
      file_size: item.file.size,
      file_hash: hash,
      mime_type: item.file.type || 'application/octet-stream',
      total_chunks: totalChunks,
      chunk_size: CHUNK_SIZE,
      folder_id: props.folderId || '',
    })

    const uploadId = initRes.data.upload_id
    const uploadedChunks: number[] = initRes.data.uploaded_chunks || []

    // 2. 上传每个分片
    for (let i = 0; i < totalChunks; i++) {
      if (uploadedChunks.includes(i)) {
        item.uploaded = i + 1
        item.progress = Math.round((item.uploaded / totalChunks) * 90)
        continue
      }

      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, item.file.size)
      const chunk = item.file.slice(start, end)

      const formData = new FormData()
      formData.append('file', chunk)
      formData.append('upload_id', uploadId)
      formData.append('file_hash', hash)
      formData.append('chunk_index', String(i))
      formData.append('total_chunks', String(totalChunks))

      await uploadApi.uploadChunk(formData)

      item.uploaded = i + 1
      item.progress = Math.round((item.uploaded / totalChunks) * 90)
    }

    // 3. 合并分片
    item.status = 'merging'
    item.progress = 95

    await uploadApi.merge({
      upload_id: uploadId,
      file_hash: hash,
      file_name: item.file.name,
      mime_type: item.file.type || 'application/octet-stream',
      total_chunks: totalChunks,
      folder_id: props.folderId || '',
      tags: [],
    })

    item.status = 'done'
    item.progress = 100
  } catch (e: any) {
    item.status = 'error'
    item.error = e.response?.data?.message || '上传失败'
  }
}

function handleClose() {
  if (isUploading.value) {
    ElMessage.warning('文件正在上传中，请等待完成')
    return
  }
  uploadQueue.value = []
}
</script>

<style scoped lang="scss">
.upload-dialog {
  :deep(.el-dialog__header) { border-bottom: 1px solid var(--border-color); }
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  text-align: center;
  transition: all var(--transition-base);
  cursor: pointer;
  background: var(--bg-muted);

  &.dragging {
    border-color: var(--primary-color);
    background: rgba(99,102,241,0.05);
    box-shadow: 0 0 0 8px rgba(99,102,241,0.04);

    .upload-icon-ring { background: rgba(99,102,241,0.1); }
  }

  &.has-files { padding: 32px 40px; }

  .upload-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .upload-icon-ring {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);

    &.pulsing {
      animation: pulse-glow 1.5s ease-in-out infinite;
    }
  }

  .upload-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
  }
  .upload-hint {
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

.upload-queue {
  margin-top: 16px;
  max-height: 320px;
  overflow-y: auto;

  .upload-item {
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    margin-bottom: 10px;
    transition: all var(--transition-fast);

    &.upload-done { border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.02); }
    &.upload-error { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.02); }

    .item-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      .item-icon {
        width: 34px; height: 34px;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        flex-shrink: 0;

        &.done { background: rgba(16,185,129,0.1); }
        &.error { background: rgba(239,68,68,0.1); }
        &.uploading, &.merging { background: rgba(99,102,241,0.1); color: var(--primary-color); }
      }

      .item-name { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-color); }
      .item-size { font-size: 12px; color: var(--text-tertiary); flex-shrink: 0; }
    }

    .item-status {
      font-size: 12px;
      margin-top: 6px;
      display: block;
      color: var(--text-tertiary);

      &.done { color: var(--success-color); font-weight: 500; }
      &.error { color: var(--danger-color); font-weight: 500; }
      &.uploading, &.merging { color: var(--primary-color); }
    }
  }
}
</style>
