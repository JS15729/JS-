<template>
  <el-dialog v-model="dialogVisible" :title="file?.name || '文件预览'" width="80%" top="5vh" destroy-on-close>
    <div class="preview-container" v-if="file">
      <!-- 图片预览 -->
      <div v-if="previewType === 'image'" class="preview-image">
        <img :src="streamUrl" :alt="file.name" />
      </div>

      <!-- 视频预览 -->
      <div v-else-if="previewType === 'video'" class="preview-video">
        <video :src="streamUrl" controls autoplay style="max-width:100%; max-height:70vh">
          您的浏览器不支持视频播放
        </video>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="previewType === 'audio'" class="preview-audio">
        <div class="audio-visual">
          <el-icon :size="80"><Headset /></el-icon>
          <p>{{ file.name }}</p>
        </div>
        <audio :src="streamUrl" controls style="width:100%">
          您的浏览器不支持音频播放
        </audio>
      </div>

      <!-- PDF预览 -->
      <div v-else-if="previewType === 'pdf'" class="preview-pdf">
        <iframe :src="streamUrl" width="100%" height="600px" frameborder="0"></iframe>
      </div>

      <!-- Markdown预览 -->
      <div v-else-if="previewType === 'markdown'" class="preview-markdown">
        <div class="markdown-body" v-html="markdownHtml"></div>
      </div>

      <!-- 代码/文本预览 -->
      <div v-else-if="previewType === 'code' || previewType === 'text'" class="preview-code">
        <pre><code v-html="codeHtml"></code></pre>
      </div>

      <!-- Office文档 (转PDF预览) -->
      <div v-else-if="previewType === 'office'" class="preview-office">
        <iframe :src="streamUrl" width="100%" height="600px" frameborder="0"></iframe>
      </div>

      <!-- 其他格式 - 提供下载 -->
      <div v-else class="preview-unknown">
        <el-icon :size="64"><Document /></el-icon>
        <p>此文件格式不支持在线预览</p>
        <p class="file-info">{{ file.name }} ({{ formatFileSize(file.size) }})</p>
        <el-button type="primary" @click="downloadFile">下载文件</el-button>
      </div>
    </div>

    <!-- 文件信息工具栏 -->
    <div class="preview-toolbar" v-if="file">
      <div class="toolbar-left">
        <span class="file-name">{{ file.original_name || file.name }}</span>
        <span class="file-meta">{{ formatFileSize(file.size) }} · {{ file.mime_type }}</span>
      </div>
      <div class="toolbar-right">
        <el-button @click="toggleFavorite">
          <el-icon><Star :style="{ color: isFav ? '#E6A23C' : '' }" /></el-icon>
          {{ isFav ? '已收藏' : '收藏' }}
        </el-button>
        <el-button @click="showShareDialog = true">
          <el-icon><Share /></el-icon> 分享
        </el-button>
        <el-button type="primary" @click="downloadFile">
          <el-icon><Download /></el-icon> 下载
        </el-button>
      </div>
    </div>

    <ShareDialog v-model:visible="showShareDialog" :file-id="file?._id || ''" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { previewApi, fileApi, favoriteApi } from '@/api'
import { formatFileSize, isImage, isVideo, isAudio, isPdf, isMarkdown, isTextOrCode } from '@/utils'
import ShareDialog from './ShareDialog.vue'

const props = defineProps<{ visible: boolean; file: any }>()
const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const showShareDialog = ref(false)
const markdownHtml = ref('')
const codeHtml = ref('')
const isFav = ref(false)

const previewType = computed(() => {
  if (!props.file) return 'unknown'
  const mime = props.file.mime_type || ''
  if (isImage(mime)) return 'image'
  if (isVideo(mime)) return 'video'
  if (isAudio(mime)) return 'audio'
  if (isPdf(mime)) return 'pdf'
  if (isMarkdown(mime, props.file.name)) return 'markdown'
  if (isTextOrCode(mime)) return 'code'
  if (mime.includes('word') || mime.includes('excel') || mime.includes('powerpoint') || mime.includes('presentation')) return 'office'
  return 'unknown'
})

const streamUrl = computed(() => {
  if (!props.file) return ''
  return previewApi.getStreamUrl(props.file._id)
})

watch(() => props.file, async (file) => {
  isFav.value = false
  markdownHtml.value = ''
  codeHtml.value = ''

  if (!file) return

  // 加载markdown/代码内容
  const pt = previewType.value
  if (pt === 'markdown' || pt === 'code') {
    try {
      const response = await fetch(streamUrl.value)
      const text = await response.text()

      if (pt === 'markdown') {
        const { marked } = await import('marked')
        markdownHtml.value = await marked(text)
      } else {
        const hljs = (await import('highlight.js')).default
        const ext = file.name?.split('.').pop() || ''
        const lang = hljs.getLanguage(ext) ? ext : 'plaintext'
        codeHtml.value = hljs.highlight(text, { language: lang }).value
      }
    } catch (e) { /* ignore */ }
  }

  // 检查是否已收藏
  try {
    const favRes: any = await favoriteApi.getList()
    isFav.value = (favRes.data || []).some((f: any) => f._id?.toString() === file._id?.toString())
  } catch (e) { /* ignore */ }
})

function downloadFile() {
  if (!props.file) return
  const url = fileApi.getDownloadUrl(props.file._id)
  window.open(url, '_blank')
}

async function toggleFavorite() {
  if (!props.file) return
  try {
    if (isFav.value) {
      await favoriteApi.remove(props.file._id)
      isFav.value = false
      ElMessage.success('已取消收藏')
    } else {
      await favoriteApi.add(props.file._id)
      isFav.value = true
      ElMessage.success('已收藏')
    }
  } catch (e: any) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped lang="scss">
.preview-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img { max-width: 100%; max-height: 70vh; object-fit: contain; }
.preview-video { width: 100%; display: flex; justify-content: center; }
.preview-audio { width: 100%; .audio-visual { text-align: center; padding: 20px; p { margin-top: 12px; font-size: 16px; } } }
.preview-pdf { width: 100%; }
.preview-code pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow: auto; max-height: 60vh; font-size: 13px; }
.preview-markdown .markdown-body { max-width: 800px; padding: 20px; line-height: 1.8; }
.preview-office { width: 100%; }
.preview-unknown { text-align: center; padding: 40px; p { margin: 12px 0; color: var(--text-secondary); } }

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  .toolbar-left {
    .file-name { font-size: 14px; font-weight: 500; display: block; }
    .file-meta { font-size: 12px; color: var(--text-secondary); }
  }
  .toolbar-right { display: flex; gap: 8px; }
}
</style>
