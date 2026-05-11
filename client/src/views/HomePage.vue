<template>
  <div class="home-page page-container">
    <!-- 欢迎横幅 - 渐变卡片 -->
    <div class="welcome-banner card-gradient anim-fade-up">
      <div class="banner-content">
        <div class="greeting">
          <h1>{{ greeting }}, {{ authStore.user?.username }} 👋</h1>
          <p class="greeting-subtitle">欢迎回到你的私有学习资料云盘</p>
        </div>
        <div class="quick-stats">
          <div class="stat-badge">
            <div class="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <span class="stat-val">{{ stats.fileCount }}</span>
            <span class="stat-lbl">文件总数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-badge">
            <div class="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></div>
            <span class="stat-val">{{ stats.folderCount }}</span>
            <span class="stat-lbl">文件夹</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-badge">
            <div class="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span class="stat-val">{{ formatFileSize(stats.totalSize) }}</span>
            <span class="stat-lbl">已使用</span>
          </div>
        </div>
      </div>
      <div class="banner-decor">
        <div class="decor-circle c1"></div>
        <div class="decor-circle c2"></div>
        <div class="decor-circle c3"></div>
      </div>
    </div>

    <!-- 快捷操作 - Bento Grid -->
    <div class="bento-grid bento-4 anim-fade-up anim-delay-1">
      <button class="action-card bento-card" @click="showUpload = true">
        <div class="bento-icon" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));color:#6366f1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <span class="ac-label">上传文件</span>
        <span class="ac-desc">支持任意格式，最大10GB</span>
        <div class="ac-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </button>
      <button class="action-card bento-card" @click="showNewFolder = true">
        <div class="bento-icon" style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(251,191,36,0.1));color:#f59e0b">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
        </div>
        <span class="ac-label">新建文件夹</span>
        <span class="ac-desc">整理你的资料</span>
        <div class="ac-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </button>
      <button class="action-card bento-card" @click="$router.push('/search')">
        <div class="bento-icon" style="background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(52,211,153,0.1));color:#10b981">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <span class="ac-label">全局搜索</span>
        <span class="ac-desc">全文检索文件</span>
        <div class="ac-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </button>

    </div>

    <!-- 快速文件夹入口 -->
    <div class="section-block anim-fade-up anim-delay-2" v-if="quickFolders.length > 0">
      <div class="section-header">
        <h3>快速访问</h3>
        <el-button text type="primary" @click="$router.push('/files')">查看全部</el-button>
      </div>
      <div class="quick-folders">
        <div v-for="folder in quickFolders" :key="folder.id" class="quick-folder-item card-hover" @click="openFolder(folder)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span class="folder-name">{{ folder.name }}</span>
          <span class="folder-count" v-if="folder.children && folder.children.length > 0">{{ folder.children.length }}个子项</span>
        </div>
      </div>
    </div>

    <!-- 双栏布局 -->
    <div class="content-grid">
      <!-- 最近文件 -->
      <div class="card-container anim-fade-up anim-delay-2">
        <div class="section-header">
          <h3>最近文件</h3>
          <el-button text type="primary" @click="$router.push('/files')">查看全部</el-button>
        </div>
        <div class="recent-list" v-if="recentFiles.length > 0">
          <div v-for="file in recentFiles.slice(0, 10)" :key="file._id" class="recent-item" @click="previewFile(file)">
            <div class="ri-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="getFileTypeColor(file.mime_type)" stroke-width="1.5">
                <template v-if="isImageType(file.mime_type)">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </template>
                <template v-else-if="isVideoType(file.mime_type)">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </template>
                <template v-else>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </template>
              </svg>
            </div>
            <div class="ri-info">
              <span class="ri-name">{{ file.name }}</span>
              <span class="ri-meta">{{ formatFileSize(file.size) }}</span>
            </div>
            <div class="ri-time">{{ formatDate(file.updatedAt || file.createdAt) }}</div>
            <div class="ri-tag" v-if="file.is_pinned">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无文件，上传你的第一个文件吧" :image-size="80" />
      </div>


    </div>

    <!-- 对话框 -->
    <el-dialog v-model="showNewFolder" title="新建文件夹" width="420px" class="modern-dialog">
      <el-input v-model="newFolderName" placeholder="输入文件夹名称" size="large" @keyup.enter="createFolder">
        <template #prefix>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </template>
      </el-input>
      <template #footer>
        <el-button @click="showNewFolder = false">取消</el-button>
        <el-button type="primary" @click="createFolder">创建</el-button>
      </template>
    </el-dialog>

    <FileUploader v-model:visible="showUpload" @success="onUploadSuccess" />
    <FilePreview v-model:visible="showPreview" :file="previewFileData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { fileApi, folderApi, favoriteApi } from '@/api'
import { formatFileSize, formatDate } from '@/utils'
import FileUploader from '@/components/FileUploader.vue'
import FilePreview from '@/components/FilePreview.vue'

type UploadRegisterFn = (fn: () => void) => (() => void) | void
const registerUpload = inject<UploadRegisterFn>('registerUpload')
let unregisterUpload: (() => void) | void = null

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({ fileCount: 0, folderCount: 0, totalSize: 0 })
const recentFiles = ref<any[]>([])
const quickFolders = ref<any[]>([])
const favCount = ref(0)
const showUpload = ref(false)
const showNewFolder = ref(false)
const newFolderName = ref('')
const showPreview = ref(false)
const previewFileData = ref<any>(null)
const loading = ref(true)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const storagePercent = computed(() => {
  if (!authStore.user) return 0
  return Math.round((authStore.user.storage_used / authStore.user.storage_quota) * 100)
})

function isImageType(mime?: string) { return mime?.startsWith('image/') }
function isVideoType(mime?: string) { return mime?.startsWith('video/') }
function getFileTypeColor(mime?: string) {
  if (!mime) return '#94a3b8'
  if (mime.startsWith('image/')) return '#10b981'
  if (mime.startsWith('video/')) return '#6366f1'
  if (mime.startsWith('audio/')) return '#f59e0b'
  if (mime.includes('pdf')) return '#ef4444'
  return '#94a3b8'
}

onMounted(() => {
  loadData()
  if (registerUpload) {
    unregisterUpload = registerUpload(() => { showUpload.value = true })
  }
})

async function loadData() {
  loading.value = true
  try {
    const [fileRes, folderRes, favRes] = await Promise.allSettled([
      fileApi.getList({ page: 1, limit: 100 }),
      folderApi.getTree(),
      favoriteApi.getList(),
    ])

    const allFiles: any[] = (fileRes.status === 'fulfilled' && fileRes.value?.data?.list) ? fileRes.value.data.list : []
    const allFolders: any[] = (folderRes.status === 'fulfilled' && folderRes.value?.data) ? folderRes.value.data : []
    const favs: any[] = (favRes.status === 'fulfilled' && favRes.value?.data) ? favRes.value.data : []

    const countFolders = (folders: any[]): number => {
      return folders.reduce((sum, f) => sum + 1 + countFolders(f.children || []), 0)
    }

    stats.value = {
      fileCount: (fileRes.status === 'fulfilled' && fileRes.value?.data?.total) ? fileRes.value.data.total : allFiles.length,
      folderCount: countFolders(allFolders),
      totalSize: allFiles.reduce((sum: number, f: any) => sum + (f.size || 0), 0),
    }
    recentFiles.value = allFiles.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    quickFolders.value = allFolders.slice(0, 6)
    favCount.value = favs.length
  } catch (e) {
    console.error('加载数据失败:', e)
  }
  loading.value = false
}

function createFolder() {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }
  folderApi.create({ name: newFolderName.value.trim() }).then(() => {
    ElMessage.success('文件夹已创建')
    showNewFolder.value = false
    newFolderName.value = ''
    loadData()
  }).catch((e: any) => ElMessage.error(e.response?.data?.message || '创建失败'))
}

function onUploadSuccess() {
  showUpload.value = false
  loadData()
}

function previewFile(file: any) {
  previewFileData.value = file
  showPreview.value = true
}

function openFolder(folder: any) {
  router.push({ path: '/files', query: { folderId: folder.id } })
}
</script>

<style scoped lang="scss">
.home-page {
  padding: 24px;
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

// === 欢迎横幅 ===
.welcome-banner {
  padding: 32px 36px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;

  .banner-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .greeting {
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .greeting-subtitle { opacity: 0.75; font-size: 15px; font-weight: 400; }
  }

  .quick-stats {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    padding: 16px 24px;
  }

  .stat-badge {
    text-align: center;
    .stat-icon { margin-bottom: 6px; opacity: 0.8; }
    .stat-val { display: block; font-size: 20px; font-weight: 700; }
    .stat-lbl { display: block; font-size: 12px; opacity: 0.7; margin-top: 2px; }
  }

  .stat-divider {
    width: 1px; height: 32px; background: rgba(255,255,255,0.3);
  }

  .banner-decor {
    position: absolute; top: 0; right: 0;
    width: 300px; height: 100%; pointer-events: none;
    .decor-circle {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .c1 { width: 200px; height: 200px; top: -60px; right: -40px; }
    .c2 { width: 120px; height: 120px; bottom: -30px; right: 60px; }
    .c3 { width: 80px; height: 80px; top: 50%; right: 140px; }
  }
}

// === 快捷操作 ===
.action-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  text-align: left;

  &:hover {
    border-color: var(--primary-light);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);

    .ac-arrow { opacity: 1; transform: translateX(0); }
  }

  .ac-label { font-size: 15px; font-weight: 600; color: var(--text-color); }
  .ac-desc { font-size: 12px; color: var(--text-tertiary); }
  .ac-arrow {
    position: absolute; top: 20px; right: 16px;
    opacity: 0; transform: translateX(-8px);
    transition: all var(--transition-base);
    color: var(--primary-color);
  }
}

// === 快速文件夹 ===
.section-block { margin-bottom: 24px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h3, h4 { font-size: 16px; font-weight: 700; color: var(--text-color); }
}

.quick-folders {
  display: flex; gap: 12px; flex-wrap: wrap;

  .quick-folder-item {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px;
    background: var(--card-bg); border: 1px solid var(--border-color);
    border-radius: var(--radius-md); cursor: pointer;
    transition: all var(--transition-fast);
    &:hover { border-color: var(--primary-light); background: var(--bg-secondary); }
    .folder-name { font-size: 14px; color: var(--text-color); font-weight: 500; }
    .folder-count {
      font-size: 11px; color: var(--text-tertiary);
      background: var(--bg-secondary); padding: 2px 6px;
      border-radius: var(--radius-full);
    }
  }
}

// === 双栏 ===
.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
}

.side-column {
  display: flex; flex-direction: column; gap: 16px;
}

// === 最近文件列表 ===
.recent-list {
  .recent-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px; border-radius: var(--radius-sm);
    cursor: pointer; transition: all var(--transition-fast);
    &:hover { background: var(--bg-secondary); }
    .ri-icon { flex-shrink: 0; }
    .ri-info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column;
      .ri-name { font-size: 14px; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ri-meta { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
    }
    .ri-time { font-size: 12px; color: var(--text-tertiary); flex-shrink: 0; }
    .ri-tag { flex-shrink: 0; }
  }
}

// === 存储概览 ===
.storage-overview-card {
  .storage-info { display: flex; align-items: center; gap: 20px; }
  .storage-ring {
    flex-shrink: 0;
    .progress-ring-simple { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    .ring-text { position: absolute; font-size: 18px; font-weight: 700; color: var(--text-color); }
  }
  .storage-details { flex: 1; display: flex; flex-direction: column; gap: 8px;
    .sd-row { display: flex; justify-content: space-between; font-size: 13px;
      .sd-label { color: var(--text-secondary); }
      .sd-value { color: var(--text-color); font-weight: 600; }
    }
  }
}

// === 快捷入口 ===
.quick-links {
  .links-list {
    display: flex; flex-direction: column; gap: 4px;
    .link-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: var(--radius-sm);
      cursor: pointer; transition: all var(--transition-fast);
      font-size: 13px; color: var(--text-color);
      &:hover { background: var(--bg-secondary); }
      .link-badge {
        margin-left: auto; font-size: 12px; color: var(--primary-color);
        background: rgba(99,102,241,0.1); padding: 1px 8px;
        border-radius: var(--radius-full); font-weight: 600;
      }
    }
  }
}
</style>
