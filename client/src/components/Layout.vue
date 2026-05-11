<template>
  <el-container class="layout-root">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header">
      <div class="header-left">
        <div class="menu-trigger" @click="collapse = !collapse">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="!collapse" d="M3 12h18M3 6h18M3 18h18"/>
            <path v-else d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </div>
        <div class="brand-name hide-on-mobile">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="url(#nav-logo)"/><path d="M14 16l10-6 10 6v16l-10 6-10-6V16z" stroke="white" stroke-width="2.5" fill="none"/><defs><linearGradient id="nav-logo" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs></svg>
          <span>私有云盘</span>
        </div>
      </div>

      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件..."
          size="default"
          clearable
          @keyup.enter="doHeaderSearch"
          class="header-search-input"
        >
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </template>
        </el-input>
      </div>

      <div class="header-right">
        <!-- 快捷操作 -->
        <el-tooltip content="上传文件" placement="bottom">
          <button class="header-icon-btn" @click="triggerUpload">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
        </el-tooltip>

        <!-- 主题切换 -->
        <el-tooltip :content="themeStore.isDark ? '亮色模式' : '暗黑模式'" placement="bottom">
          <button class="header-icon-btn theme-btn" @click="themeStore.toggleTheme()">
            <svg v-if="!themeStore.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </el-tooltip>

        <!-- 通知 -->
        <el-popover placement="bottom-end" :width="360" trigger="click" @show="loadNotifications">
          <template #reference>
            <button class="header-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span class="notif-dot" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
          </template>
          <div class="notif-popover">
            <div class="notif-header">
              <span>系统通知</span>
              <button @click="markAllRead" v-if="unreadCount > 0" class="mark-all-btn">全部已读</button>
            </div>
            <div class="notif-list" v-if="announcements.length > 0">
              <div v-for="item in announcements.slice(0, 5)" :key="item._id" class="notif-item" :class="{ unread: !item.is_read }" @click="readNotif(item)">
                <div class="notif-level" :class="item.level"></div>
                <div class="notif-body">
                  <span class="notif-title">{{ item.title }}</span>
                  <span class="notif-time">{{ formatDate(item.created_at) }}</span>
                </div>
                <span class="notif-unread-dot" v-if="!item.is_read"></span>
              </div>
            </div>
            <div class="notif-empty" v-else>
              <p>暂无通知</p>
            </div>
            <div class="notif-footer" v-if="authStore.isAdmin">
              <el-button text type="primary" size="small" @click="$router.push('/admin/announcements')">管理公告</el-button>
            </div>
          </div>
        </el-popover>

        <!-- 用户下拉 -->
        <el-dropdown trigger="click" v-if="authStore.user" class="user-dropdown">
          <div class="user-trigger">
            <el-avatar :size="34" class="user-avatar" :src="authStore.user.avatar || ''">
              {{ authStore.user.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <div class="user-meta hide-on-mobile">
              <span class="user-name">{{ authStore.user.username }}</span>
              <span class="user-role">{{ authStore.isAdmin ? '管理员' : '用户' }}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hide-on-mobile"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <div class="dropdown-header">
                <div class="dropdown-user-info">
                  <el-avatar :size="40" class="user-avatar" :src="authStore.user.avatar || ''">
                    {{ authStore.user.username?.charAt(0)?.toUpperCase() }}
                  </el-avatar>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:var(--text-color)">{{ authStore.user.username }}</div>
                    <div style="font-size:12px;color:var(--text-tertiary)">{{ authStore.user.email }}</div>
                  </div>
                </div>
                <div class="storage-bar">
                  <div class="storage-label">
                    <span>存储空间</span>
                    <span>{{ storagePercent }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: storagePercent + '%' }" :class="{ warn: storagePercent > 80, danger: storagePercent > 95 }"></div>
                  </div>
                  <span class="storage-detail">{{ formatFileSize(authStore.user?.storage_used || 0) }} / {{ formatFileSize(authStore.user?.storage_quota || 0) }}</span>
                </div>
              </div>
              <el-dropdown-item divided @click="openProfile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item @click="$router.push('/search')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                全局搜索
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout" class="logout-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="layout-body">
      <!-- 侧边栏 -->
      <el-aside :width="collapse ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'" class="layout-aside">
        <nav class="sidebar-nav">
          <!-- 主导航 -->
          <div class="nav-section">
            <div class="nav-item" :class="{ active: route.path === '/files' }" @click="$router.push('/files')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#3b82f6,#6366f1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text">
                <span class="nav-label">我的文件</span>
              </span>
            </div>

            <div class="nav-item" :class="{ active: route.path === '/favorites' }" @click="$router.push('/favorites')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#f59e0b,#fbbf24)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text">
                <span class="nav-label">我的收藏</span>
              </span>
            </div>

            <div class="nav-item" :class="{ active: route.path === '/share-list' }" @click="$router.push('/share-list')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#10b981,#34d399)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text">
                <span class="nav-label">我的分享</span>
              </span>
            </div>

            <div class="nav-item" :class="{ active: route.path === '/recycle' }" @click="$router.push('/recycle')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#64748b,#94a3b8)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text">
                <span class="nav-label">回收站</span>
              </span>
            </div>
          </div>

          <!-- 管理导航 -->
          <div class="nav-section" v-if="authStore.isAdmin && !collapse">
            <div class="nav-section-title">管理后台</div>
          </div>
          <div class="nav-section" v-if="authStore.isAdmin">
            <div class="nav-item" :class="{ active: route.path.startsWith('/admin/users') }" @click="$router.push('/admin/users')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#ef4444,#f87171)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text"><span class="nav-label">用户管理</span></span>
            </div>

            <div class="nav-item" :class="{ active: route.path.startsWith('/admin/config') }" @click="$router.push('/admin/config')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#8b5cf6,#a855f7)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text"><span class="nav-label">系统配置</span></span>
            </div>

            <div class="nav-item" :class="{ active: route.path === '/analytics' }" @click="$router.push('/analytics')">
              <div class="nav-icon" style="background:linear-gradient(135deg,#3b82f6,#60a5fa)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
              </div>
              <span v-if="!collapse" class="nav-text"><span class="nav-label">存储分析</span></span>
            </div>
          </div>

          <!-- 底部用户信息 -->
          <div class="nav-footer" v-if="!collapse">
            <div class="user-card" @click="openProfile">
              <el-avatar :size="36" class="footer-avatar" :src="authStore.user?.avatar || ''">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="footer-meta">
                <span class="footer-name">{{ authStore.user?.username }}</span>
                <span class="footer-email">{{ authStore.user?.email }}</span>
              </div>
            </div>
          </div>
        </nav>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 个人中心抽屉 -->
    <ProfilePage v-model="showProfile" />

    <!-- 移动端底部导航 -->
    <div class="mobile-nav">
      <div class="mn-item" :class="{ active: route.path === '/files' }" @click="$router.push('/files')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        <span>文件</span>
      </div>
      <div class="mn-item mn-upload" @click="triggerUpload">
        <div class="mn-upload-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <span>上传</span>
      </div>
      <div class="mn-item" :class="{ active: route.path === '/search' }" @click="$router.push('/search')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <span>搜索</span>
      </div>
      <div class="mn-item" :class="{ active: showProfile }" @click="openProfile">
        <el-avatar :size="24" class="mn-avatar" :src="authStore.user?.avatar || ''">
          {{ authStore.user?.username?.charAt(0)?.toUpperCase() }}
        </el-avatar>
        <span>我的</span>
      </div>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { formatFileSize, formatDate } from '@/utils'
import { announcementApi } from '@/api'
import ProfilePage from '@/views/ProfilePage.vue'

// 上传触发器：子页面通过 provide/inject 注册自己的上传函数
type UploadTriggerFn = () => void
const uploadTrigger = ref<UploadTriggerFn | null>(null)

// 提供给子页面，用于注册上传触发函数；返回取消注册的函数
function registerUploadTrigger(fn: UploadTriggerFn) {
  uploadTrigger.value = fn
  return () => { if (uploadTrigger.value === fn) uploadTrigger.value = null }
}
provide('registerUpload', registerUploadTrigger)

// 点击上传按钮时，调用子页面注册的函数
function triggerUpload() {
  if (uploadTrigger.value) {
    uploadTrigger.value()
  } else {
    console.warn('[Layout] 当前页面未注册上传触发器')
  }
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const collapse = ref(false)
const unreadCount = ref(0)
const announcements = ref<any[]>([])
const searchKeyword = ref('')
const showProfile = ref(false)

const storagePercent = computed(() => {
  if (!authStore.user) return 0
  return Math.round((authStore.user.storage_used / authStore.user.storage_quota) * 100)
})

onMounted(() => {
  loadUnreadCount()
  setInterval(() => loadUnreadCount(), 60000)
})

async function loadUnreadCount() {
  try {
    const res: any = await announcementApi.getUnreadCount()
    unreadCount.value = res.data?.count || 0
  } catch (e) { /* */ }
}

async function loadNotifications() {
  try {
    const res: any = await announcementApi.getList()
    announcements.value = res.data || []
  } catch (e) { /* */ }
}

async function readNotif(item: any) {
  if (!item.is_read) {
    try { await announcementApi.markAsRead(item._id); unreadCount.value = Math.max(0, unreadCount.value - 1); item.is_read = true } catch (e) { /* */ }
  }
  ElMessageBox.alert(item.content, item.title, { confirmButtonText: '知道了', type: item.level === 'important' ? 'warning' : 'info' })
}

async function markAllRead() {
  try { await announcementApi.markAllRead(); unreadCount.value = 0; announcements.value.forEach((a: any) => a.is_read = true) } catch (e) { /* */ }
}

function openSearch() {
  router.push('/search')
}

function doHeaderSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
    searchKeyword.value = ''
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function openProfile() {
  showProfile.value = true
}

</script>

<style scoped lang="scss">
.layout-root {
  height: 100vh;
  overflow: hidden;
}

// === 顶栏 ===
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: var(--header-height);
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;

  .menu-trigger {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm);
    cursor: pointer; color: var(--text-secondary);
    transition: all var(--transition-fast);
    &:hover { background: var(--bg-secondary); color: var(--text-color); }
  }

  .brand-name {
    display: flex; align-items: center; gap: 10px;
    span { font-size: 17px; font-weight: 700; color: var(--text-color); letter-spacing: -0.3px; }
  }
}

.header-center {
  flex: 1; max-width: 420px; margin: 0 24px;

  .header-search-input {
    :deep(.el-input__wrapper) {
      border-radius: var(--radius-full);
      background: var(--bg-color);
      box-shadow: none;
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      transition: all var(--transition-base);
      
      &:hover, &:focus-within {
        border-color: var(--primary-light);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
      }
    }
    
    :deep(.el-input__inner) {
      font-size: 14px;
    }
    
    :deep(.el-input__prefix) {
      color: var(--text-tertiary);
    }
  }
}

.header-right {
  display: flex; align-items: center; gap: 6px;
}

.header-icon-btn {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); border: none; cursor: pointer;
  background: transparent; color: var(--text-secondary);
  transition: all var(--transition-fast); position: relative;

  &:hover { background: var(--bg-secondary); color: var(--text-color); }

  .notif-dot {
    position: absolute; top: 2px; right: 2px;
    min-width: 16px; height: 16px; padding: 0 4px;
    border-radius: 8px; font-size: 10px; font-weight: 700;
    background: var(--danger-color); color: white;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--card-bg);
  }
}

// 通知弹窗
.notif-popover {
  .notif-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 10px; margin-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600; font-size: 15px;
    .mark-all-btn {
      font-size: 12px; color: var(--primary-color); border: none; background: none; cursor: pointer;
      &:hover { text-decoration: underline; }
    }
  }
  .notif-list {
    max-height: 320px; overflow-y: auto;
    .notif-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 8px; border-radius: 6px; cursor: pointer;
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-secondary); }
      &.unread { background: rgba(99,102,241,0.04); }
      .notif-level {
        width: 4px; height: 32px; border-radius: 2px; flex-shrink: 0; margin-top: 2px;
        &.info { background: #3b82f6; }
        &.warning { background: #f59e0b; }
        &.important { background: #ef4444; }
        &.success { background: #10b981; }
      }
      .notif-body {
        flex: 1;
        .notif-title { display: block; font-size: 14px; color: var(--text-color); font-weight: 500; }
        .notif-time { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 3px; }
      }
      .notif-unread-dot {
        width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); flex-shrink: 0; margin-top: 8px;
      }
    }
  }
  .notif-empty {
    text-align: center; padding: 24px; color: var(--text-tertiary); font-size: 13px;
  }
  .notif-footer {
    text-align: center; padding-top: 8px; border-top: 1px solid var(--border-color); margin-top: 8px;
  }
}

.user-dropdown {
  .user-trigger {
    display: flex; align-items: center; gap: 10px;
    padding: 4px 10px 4px 4px; border-radius: var(--radius-full);
    cursor: pointer; transition: all var(--transition-fast);

    &:hover { background: var(--bg-secondary); }

    .user-avatar {
      background: var(--primary-gradient);
      color: white; font-weight: 700; font-size: 14px;
    }

    .user-meta {
      display: flex; flex-direction: column;
      .user-name { font-size: 14px; font-weight: 600; color: var(--text-color); line-height: 1.2; }
      .user-role { font-size: 11px; color: var(--text-tertiary); }
    }
  }
}

.dropdown-header {
  padding: 12px 16px; min-width: 240px;

  .dropdown-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-light);

    .user-avatar {
      background: var(--primary-gradient);
      color: white; font-weight: 700; font-size: 14px;
      flex-shrink: 0;
    }
  }

  .storage-bar {
    .storage-label {
      display: flex; justify-content: space-between;
      font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;
    }
    .progress-track {
      height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;
      .progress-fill {
        height: 100%; border-radius: 2px;
        background: var(--primary-gradient); transition: width 0.5s ease;
        &.warn { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
        &.danger { background: linear-gradient(135deg,#ef4444,#f87171); }
      }
    }
    .storage-detail { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; display: block; }
  }
}

.logout-item {
  color: var(--danger-color) !important;
}

// === 侧边栏 ===
.layout-aside {
  background: var(--card-bg);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-slow);
  overflow: hidden;
}

.sidebar-nav {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 10px;
}

.nav-section {
  margin-bottom: 4px;

  .nav-section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-tertiary);
    padding: 16px 14px 8px;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
  position: relative;

  &:hover {
    background: var(--bg-secondary);
  }

  &.active {
    background: var(--bg-color);

    .nav-label { color: var(--primary-color); font-weight: 600; }

    &::before {
      content: '';
      position: absolute;
      left: 0; top: 50%; transform: translateY(-50%);
      width: 3px; height: 20px;
      background: var(--primary-gradient);
      border-radius: 0 3px 3px 0;
    }
  }

  .nav-icon {
    width: 34px; height: 34px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .nav-label {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
  }
}

.nav-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);

  .user-card {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: var(--radius-md);
    cursor: pointer; transition: all var(--transition-fast);

    &:hover { background: var(--bg-secondary); }

    .footer-avatar {
      background: var(--primary-gradient);
      color: white; font-weight: 600; font-size: 14px;
    }

    .footer-meta {
      display: flex; flex-direction: column; overflow: hidden;
      .footer-name { font-size: 13px; font-weight: 600; color: var(--text-color); }
      .footer-email { font-size: 11px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; }
    }
  }
}

// === 主内容 ===
.layout-main {
  background: var(--bg-color);
  padding: 0;
  overflow: auto; // 改为 auto，让内容可以滚动
}

// === 移动端底部导航 ===
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 200;
  height: 60px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  padding-bottom: env(safe-area-inset-bottom, 0);

  @media (max-width: 768px) { display: flex; }

  .mn-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex: 1;
    color: var(--text-tertiary);
    transition: all var(--transition-fast);

    span { font-size: 10px; font-weight: 500; }
    svg { transition: color var(--transition-fast); }

    &.active {
      color: var(--primary-color);
    }

    &:hover { color: var(--primary-color); }
  }

  .mn-upload {
    .mn-upload-btn {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--primary-gradient);
      display: flex; align-items: center; justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
      margin-bottom: -6px;
    }
    span { margin-top: 4px; }
  }

  .mn-avatar {
    background: var(--primary-gradient);
    color: white;
    font-weight: 700;
    font-size: 10px;
  }
}

// 移动端时隐藏侧边栏
@media (max-width: 768px) {
  .layout-aside { display: none !important; }
  .layout-main { padding-bottom: 60px; }
}
</style>
