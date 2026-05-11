<template>
  <div class="preview-page">
    <div class="preview-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <span class="preview-title">{{ file?.name || '文件预览' }}</span>
      <el-button type="primary" @click="downloadFile">下载</el-button>
    </div>

    <div class="preview-body" v-if="file">
      <!-- 全屏图片 -->
      <div v-if="isImage(file.mime_type)" class="full-image">
        <img :src="streamUrl" />
      </div>

      <!-- 全屏视频 -->
      <div v-else-if="isVideo(file.mime_type)" class="full-video">
        <video :src="streamUrl" controls autoplay style="max-height:80vh"></video>
      </div>

      <!-- PDF全屏 -->
      <iframe v-else-if="isPdf(file.mime_type)" :src="streamUrl" class="full-pdf" />

      <!-- Markdown -->
      <div v-else-if="isMarkdown(file.mime_type, file.name)" class="markdown-view" v-html="contentHtml" />

      <!-- 代码 -->
      <div v-else-if="isTextOrCode(file.mime_type)" class="code-view">
        <pre><code v-html="contentHtml"></code></pre>
      </div>

      <!-- 其他 -->
      <div v-else class="unsupported">
        <p>此文件格式不支持全屏预览</p>
        <el-button type="primary" @click="downloadFile">下载文件</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fileApi, previewApi } from '@/api'
import { isImage, isVideo, isPdf, isMarkdown, isTextOrCode } from '@/utils'

const route = useRoute()
const fileId = route.params.fileId as string
const file = ref<any>(null)
const contentHtml = ref('')

const streamUrl = computed(() => {
  return file.value ? previewApi.getStreamUrl(file.value._id) : ''
})

onMounted(async () => {
  try {
    const res: any = await fileApi.getById(fileId)
    file.value = res.data

    // 加载文本内容
    const pt = isMarkdown(file.value.mime_type, file.value.name) ? 'markdown' :
               isTextOrCode(file.value.mime_type) ? 'code' : ''
    if (pt) {
      const response = await fetch(streamUrl.value)
      const text = await response.text()
      if (pt === 'markdown') {
        const { marked } = await import('marked')
        contentHtml.value = await marked(text)
      } else {
        const hljs = (await import('highlight.js')).default
        const ext = file.value.name?.split('.').pop() || ''
        const lang = hljs.getLanguage(ext) ? ext : 'plaintext'
        contentHtml.value = hljs.highlight(text, { language: lang }).value
      }
    }
  } catch (e) { /* ignore */ }
})

function downloadFile() {
  if (file.value) {
    window.open(fileApi.getDownloadUrl(file.value._id), '_blank')
  }
}
</script>

<style scoped lang="scss">
.preview-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  .preview-title { font-size: 16px; font-weight: 500; }
}

.preview-body {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.full-image img { max-width: 100%; max-height: 80vh; }
.full-video { display: flex; justify-content: center; }
.full-pdf { width: 100%; height: calc(100vh - 60px); border: none; }
.markdown-view { max-width: 800px; line-height: 1.8; }
.code-view {
  width: 100%;
  pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow: auto; max-height: 80vh; font-size: 13px; }
}
.unsupported { text-align: center; p { margin-bottom: 16px; color: var(--text-secondary); } }
</style>
