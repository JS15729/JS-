<template>
  <div class="share-page">
    <div class="share-card">
      <!-- 需要密码验证 -->
      <template v-if="shareData && shareData.has_password && !verified">
        <div class="lock-section">
          <el-icon :size="48" color="#409EFF"><Lock /></el-icon>
          <h2>此文件需要提取码</h2>
          <p>请输入提取码以访问文件</p>
          <div class="password-input">
            <el-input v-model="password" placeholder="请输入提取码" maxlength="8" @keyup.enter="verify" />
            <el-button type="primary" @click="verify" :loading="loading">验证</el-button>
          </div>
        </div>
      </template>

      <!-- 文件信息展示 -->
      <template v-else-if="shareData">
        <div class="file-section">
          <el-icon :size="64" :class="getFileIconClass(shareData.file?.mime_type)">
            <component :is="getFileIcon(shareData.file?.mime_type)" />
          </el-icon>
          <h2>{{ shareData.file?.name }}</h2>
          <p class="file-meta">
            {{ formatFileSize(shareData.file?.size) }} · {{ shareData.file?.mime_type }}
          </p>

          <!-- 图片预览 -->
          <img v-if="isImage(shareData.file?.mime_type)" :src="previewUrl" class="preview-img" />

          <!-- 视频预览 -->
          <video v-else-if="isVideo(shareData.file?.mime_type)" :src="previewUrl" controls class="preview-video" />

          <!-- 音频预览 -->
          <audio v-else-if="isAudio(shareData.file?.mime_type)" :src="previewUrl" controls class="preview-audio" />

          <!-- PDF预览 -->
          <iframe v-else-if="isPdf(shareData.file?.mime_type)" :src="previewUrl" class="preview-pdf" />

          <div class="actions">
            <el-button type="primary" size="large" @click="download">
              <el-icon><Download /></el-icon> 下载文件 ({{ formatFileSize(shareData.file?.size) }})
            </el-button>
          </div>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-else class="loading-section">
        <el-icon :size="32" class="is-loading"><Loading /></el-icon>
        <p>加载分享文件...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { shareApi } from '@/api'
import { formatFileSize, getFileIcon, getFileIconClass, isImage, isVideo, isAudio, isPdf } from '@/utils'

const route = useRoute()
const code = route.params.code as string

const shareData = ref<any>(null)
const verified = ref(false)
const password = ref('')
const loading = ref(false)

const previewUrl = computed(() => {
  if (!shareData.value) return ''
  return `/api/preview/share/${shareData.value.file?.id}/stream`
})

onMounted(async () => {
  try {
    const res: any = await shareApi.getByCode(code)
    shareData.value = res.data

    // 如果没有密码，直接显示
    if (!shareData.value.has_password) {
      verified.value = true
    }
  } catch (e: any) {
    ElMessage.error('分享链接不存在或已失效')
  }
})

async function verify() {
  if (!password.value) {
    ElMessage.warning('请输入提取码')
    return
  }
  loading.value = true
  try {
    await shareApi.verifyCode(code, password.value)
    verified.value = true
    // 重新获取数据
    const res: any = await shareApi.getByCode(code)
    shareData.value = res.data
  } catch (e: any) {
    ElMessage.error('提取码错误')
  } finally {
    loading.value = false
  }
}

function download() {
  const url = shareApi.getDownloadUrl(code, password.value)
  window.open(url, '_blank')
}
</script>

<style scoped lang="scss">
.share-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.share-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  max-width: 700px;
  width: 100%;
  text-align: center;

  h2 { margin: 16px 0 8px; font-size: 20px; }
  .file-meta { color: #909399; font-size: 14px; margin-bottom: 20px; }

  .lock-section {
    .password-input {
      display: flex;
      gap: 12px;
      max-width: 360px;
      margin: 20px auto 0;
    }
  }

  .file-section {
    .preview-img { max-width: 100%; max-height: 400px; border-radius: 8px; }
    .preview-video { max-width: 100%; max-height: 400px; }
    .preview-pdf { width: 100%; height: 500px; border: none; border-radius: 8px; }
    .actions { margin-top: 24px; }
  }
}

@media (max-width: 768px) {
  .share-card { padding: 24px; }
}
</style>
