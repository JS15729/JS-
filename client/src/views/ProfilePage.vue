<template>
  <!-- 个人中心抽屉 -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    :size="isMobile ? '85%' : '420px'"
    :direction="isMobile ? 'btt' : 'rtl'"
    class="profile-drawer"
    :destroy-on-close="false"
    @closed="handleClosed"
  >
    <!-- 自定义头部 -->
    <div class="drawer-header">
      <div class="header-left">
        <div class="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span class="header-title">个人中心</span>
      </div>
      <button class="close-btn" @click="visible = false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="drawer-body">
      <!-- 用户资料卡 -->
      <div class="user-card">
        <div class="avatar-section" @click="triggerAvatarUpload">
          <el-avatar :size="72" :src="userAvatarUrl" class="user-avatar">
            {{ initials }}
          </el-avatar>
          <div class="avatar-overlay">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>更换</span>
          </div>
        </div>
        <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="onAvatarChange" />

        <div class="user-info">
          <h3 class="username">{{ authStore.user?.username }}</h3>
          <el-tag :type="authStore.isAdmin ? 'danger' : 'info'" size="small" effect="light">
            {{ authStore.isAdmin ? '管理员' : '普通用户' }}
          </el-tag>
          <p class="user-email">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <!-- 存储空间 -->
      <div class="storage-card">
        <div class="storage-header">
          <span class="storage-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            存储空间
          </span>
          <span class="storage-percent" :class="storageClass">{{ storagePercent }}%</span>
        </div>
        <div class="storage-bar">
          <div class="storage-fill" :style="{ width: storagePercent + '%' }" :class="storageClass"></div>
        </div>
        <p class="storage-detail">{{ formatFileSize(authStore.user?.storage_used || 0) }} / {{ formatFileSize(authStore.user?.storage_quota || 0) }}</p>
      </div>

      <!-- 功能菜单 -->
      <div class="menu-section">
        <div class="menu-title">账户设置</div>
        <div class="menu-list">
          <div class="menu-item" @click="activeTab = 'info'" :class="{ active: activeTab === 'info' }">
            <div class="menu-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>基本信息</span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          <div class="menu-item" @click="activeTab = 'security'" :class="{ active: activeTab === 'security' }">
            <div class="menu-icon" style="background: linear-gradient(135deg, #ef4444, #f87171)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <span>账号安全</span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          <div class="menu-item" @click="activeTab = 'theme'" :class="{ active: activeTab === 'theme' }">
            <div class="menu-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </div>
            <span>背景设置</span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          <div class="menu-item" @click="activeTab = 'activity'" :class="{ active: activeTab === 'activity' }">
            <div class="menu-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span>活动记录</span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 子页面内容 -->
      <div class="sub-page" v-show="activeTab !== 'menu'">
        <div class="sub-page-header">
          <button class="back-btn" @click="activeTab = 'menu'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            返回
          </button>
          <span class="sub-page-title">{{ getTabTitle(activeTab) }}</span>
        </div>

        <!-- 基本信息 -->
        <div v-show="activeTab === 'info'" class="sub-page-content">
          <el-form :model="infoForm" :rules="infoRules" ref="infoRef" label-position="top" class="compact-form">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="infoForm.username" placeholder="输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="infoForm.email" placeholder="输入邮箱" />
            </el-form-item>
            <el-form-item label="个性签名">
              <el-input v-model="infoForm.bio" type="textarea" :rows="2" placeholder="介绍一下自己..." maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveInfo" :loading="savingInfo" class="w-full">保存修改</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 账号安全 -->
        <div v-show="activeTab === 'security'" class="sub-page-content">
          <el-form :model="pwForm" :rules="pwRules" ref="pwRef" label-position="top" class="compact-form">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="pwForm.oldPassword" type="password" show-password placeholder="输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwForm.newPassword" type="password" show-password placeholder="至少6位" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="pwForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePw" :loading="changing" class="w-full">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 背景设置 -->
        <div v-show="activeTab === 'theme'" class="sub-page-content">
          <!-- 预设背景 -->
          <div class="theme-section">
            <h4>预设背景</h4>
            <div class="bg-grid">
              <div
                v-for="bg in presetBgOptions"
                :key="bg.value"
                class="bg-item"
                :class="{ active: currentBgType === 'preset' && currentBgValue === bg.value }"
                @click="changeBackground(bg.value)"
              >
                <div class="bg-preview" :style="{ background: bg.preview }"></div>
                <span>{{ bg.label }}</span>
              </div>
            </div>
          </div>

          <!-- 上传自定义背景 -->
          <div class="theme-section">
            <h4>自定义背景</h4>
            <el-button size="small" @click="triggerBgUpload" class="w-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              上传自定义背景
            </el-button>
            <input ref="bgInput" type="file" accept="image/*" style="display: none" @change="onBgChange" />
          </div>

          <!-- 背景调节：仅当有背景时显示 -->
          <div class="theme-section" v-if="currentBgType !== 'default'">
            <h4>背景调节</h4>
            <div class="bg-adjust-section">
              <div class="adjust-item">
                <div class="adjust-label">
                  <span>背景亮度</span>
                  <span class="adjust-value">{{ bgBrightness }}%</span>
                </div>
                <el-slider
                  v-model="bgBrightness"
                  :min="0"
                  :max="100"
                  :step="1"
                  @change="onBrightnessChange"
                  :format-tooltip="(val: number) => val + '%'"
                />
              </div>
              <div class="adjust-item">
                <div class="adjust-label">
                  <span>背景模糊</span>
                  <span class="adjust-value">{{ bgBlur }}px</span>
                </div>
                <el-slider
                  v-model="bgBlur"
                  :min="0"
                  :max="20"
                  :step="1"
                  @change="onBlurChange"
                  :format-tooltip="(val: number) => val + 'px'"
                />
              </div>
              <div class="adjust-item">
                <div class="adjust-label">
                  <span>背景深浅</span>
                  <span class="adjust-value">{{ bgOpacity }}%</span>
                </div>
                <el-slider
                  v-model="bgOpacity"
                  :min="0"
                  :max="100"
                  :step="1"
                  @change="onOpacityChange"
                  :format-tooltip="(val: number) => val + '%'"
                />
              </div>
              <el-button size="small" @click="changeBackground('default')" class="w-full" type="danger" plain>
                恢复默认背景
              </el-button>
            </div>
          </div>

          <!-- 历史背景 -->
          <div class="theme-section" v-if="themeStore.backgroundHistory.length > 0">
            <div class="section-header">
              <h4>历史背景</h4>
              <el-button size="small" text type="primary" @click="showHistory = !showHistory">
                {{ showHistory ? '收起' : '展开' }}
              </el-button>
            </div>
            <div v-show="showHistory" class="history-list">
              <div
                v-for="record in themeStore.backgroundHistory"
                :key="record.id"
                class="history-item"
              >
                <div class="history-preview" @click="selectHistoryBg(record)">
                  <div
                    class="history-thumb"
                    :style="record.type === 'custom'
                      ? { backgroundImage: 'url(' + record.value + ')', backgroundSize: 'cover' }
                      : { background: record.preview || 'var(--bg-color)' }"
                  ></div>
                  <div class="history-info">
                    <span class="history-name">{{ record.name }}</span>
                    <span class="history-date">{{ new Date(record.addedAt).toLocaleDateString() }}</span>
                  </div>
                </div>
                <button class="history-remove" @click="removeHistoryBg(record)" title="移除">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 活动记录 -->
        <div v-show="activeTab === 'activity'" class="sub-page-content">
          <div class="activity-list" v-if="recentFiles.length > 0">
            <div v-for="file in recentFiles.slice(0, 10)" :key="file._id" class="activity-item">
              <div class="file-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="activity-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-meta">{{ formatDate(file.updatedAt || file.createdAt) }} · {{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无活动记录" :image-size="60" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import type { BackgroundRecord } from '@/stores/theme'
import { authApi, fileApi } from '@/api'
import { formatFileSize, formatDate } from '@/utils'

const props = defineProps<{ modelValue?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const authStore = useAuthStore()
const themeStore = useThemeStore()

const visible = computed({
  get: () => props.modelValue ?? false,
  set: (v: boolean) => emit('update:modelValue', v)
})
const activeTab = ref('menu')
const savingInfo = ref(false)
const changing = ref(false)
const recentFiles = ref<any[]>([])
const isMobile = ref(false)

// 背景相关
const bgBrightness = ref(themeStore.backgroundBrightness)
const bgBlur = ref(themeStore.backgroundBlur)
const bgOpacity = ref(themeStore.backgroundOpacity)
const showHistory = ref(false)

const avatarInput = ref<HTMLInputElement>()
const bgInput = ref<HTMLInputElement>()
const infoRef = ref()
const pwRef = ref()

// 预设背景选项
const presetBgOptions = [
  { label: '默认', value: 'default', preview: 'var(--bg-color)' },
  { label: '紫霞', value: 'gradient', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '暗夜', value: 'dark', preview: '#0f172a' },
  { label: '星空', value: 'stars', preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: '海洋', value: 'ocean', preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: '日落', value: 'sunset', preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
]

const initials = computed(() => authStore.user?.username?.charAt(0)?.toUpperCase() || '?')
const userAvatarUrl = computed(() => authStore.user?.avatar || '')

const storagePercent = computed(() => {
  if (!authStore.user) return 0
  return Math.min(Math.round(((authStore.user.storage_used || 0) / (authStore.user.storage_quota || 1)) * 100), 100)
})

const storageClass = computed(() => {
  if (storagePercent.value > 90) return 'danger'
  if (storagePercent.value > 75) return 'warn'
  return ''
})

// 当前背景类型
const currentBgType = computed(() => themeStore.backgroundType)
const currentBgValue = computed(() => themeStore.backgroundValue)

// 表单数据
const infoForm = reactive({
  username: authStore.user?.username || '',
  email: authStore.user?.email || '',
  bio: '',
})

const infoRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '3-20个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

const pwForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '至少6位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, v: string, cb: any) => {
        cb(v !== pwForm.newPassword ? new Error('密码不一致') : undefined)
      },
      trigger: 'blur',
    },
  ],
}

function getTabTitle(tab: string) {
  const titles: Record<string, string> = {
    info: '基本信息',
    security: '账号安全',
    theme: '背景设置',
    activity: '活动记录',
  }
  return titles[tab] || ''
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function open() {
  emit('update:modelValue', true)
  activeTab.value = 'menu'
  initFormData()
  loadRecentFiles()
  checkMobile()
  bgBrightness.value = themeStore.backgroundBrightness
  bgBlur.value = themeStore.backgroundBlur
  bgOpacity.value = themeStore.backgroundOpacity
}

function close() {
  emit('update:modelValue', false)
}

function initFormData() {
  infoForm.username = authStore.user?.username || ''
  infoForm.email = authStore.user?.email || ''
}

async function loadRecentFiles() {
  try {
    const res: any = await fileApi.getList({ page: 1, limit: 10 })
    recentFiles.value = res.data?.list || []
  } catch (e) {
    console.error('加载最近文件失败', e)
  }
}

async function saveInfo() {
  try {
    await infoRef.value?.validate()
  } catch {
    return
  }
  savingInfo.value = true
  try {
    const res: any = await authApi.updateProfile({
      username: infoForm.username,
      email: infoForm.email,
    })
    const updated = res?.data ?? res
    if (updated && authStore.user) {
      authStore.user = { ...authStore.user, ...updated }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    ElMessage.success('个人信息已更新')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    savingInfo.value = false
  }
}

async function changePw() {
  try {
    await pwRef.value?.validate()
  } catch {
    return
  }
  changing.value = true
  try {
    await authApi.changePassword({
      oldPassword: pwForm.oldPassword,
      newPassword: pwForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    setTimeout(() => {
      authStore.logout()
      window.location.href = '/login'
    }, 1500)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '密码修改失败')
  } finally {
    changing.value = false
  }
}

// 头像上传
function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过5MB')
    return
  }
  try {
    const fd = new FormData()
    fd.append('avatar', file)
    const res: any = await authApi.uploadAvatar(fd)
    const avatarUrl = res.data?.avatar
    if (authStore.user) {
      authStore.user = { ...authStore.user, avatar: avatarUrl }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    ElMessage.success('头像已更新')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '头像上传失败')
  }
}

// 背景上传
function triggerBgUpload() {
  bgInput.value?.click()
}

// 压缩图片：缩小尺寸 + JPEG 压缩，返回压缩后的 data URL
function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      const result = canvas.toDataURL('image/jpeg', quality)
      URL.revokeObjectURL(img.src)
      console.log('[compressImage] 原大小:', file.size, '压缩后 URL 长度:', result.length)
      resolve(result)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function onBgChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('背景图片不能超过10MB')
    return
  }
  try {
    const dataUrl = await compressImage(file, 1920, 0.8)
    console.log('[onBgChange] 压缩后 URL 长度:', dataUrl.length)
    themeStore.setBackground('custom', dataUrl)
    const record: BackgroundRecord = {
      id: 'custom_' + Date.now(),
      name: file.name || '自定义背景',
      type: 'custom',
      value: dataUrl,
      addedAt: Date.now(),
    }
    themeStore.addToHistory(record)
    ElMessage.success('背景已更新')
  } catch (err) {
    console.error('[onBgChange] 压缩失败:', err)
    ElMessage.error('图片处理失败，请重试')
  }
}

// 更换预设背景
function changeBackground(bg: string) {
  if (bg === 'default') {
    themeStore.resetBackground()
    ElMessage.success('已恢复默认背景')
  } else {
    themeStore.setBackground('preset', bg)
    const record: BackgroundRecord = {
      id: 'preset_' + bg,
      name: presetBgOptions.find(b => b.value === bg)?.label || bg,
      type: 'preset',
      value: bg,
      preview: presetBgOptions.find(b => b.value === bg)?.preview,
      addedAt: Date.now(),
    }
    themeStore.addToHistory(record)
    ElMessage.success('背景已更新')
  }
}

// 从历史记录选择背景
function selectHistoryBg(record: BackgroundRecord) {
  if (record.type === 'custom') {
    themeStore.setBackground('custom', record.value)
  } else if (record.type === 'preset') {
    if (record.value === 'default') {
      themeStore.resetBackground()
    } else {
      themeStore.setBackground('preset', record.value)
    }
  }
  ElMessage.success('背景已切换')
}

// 移除历史记录
function removeHistoryBg(record: BackgroundRecord) {
  themeStore.removeFromHistory(record.id)
  ElMessage.success('已从历史记录中移除')
}

// 亮度调节
function onBrightnessChange(val: number) {
  themeStore.setBackgroundBrightness(val)
}

// 模糊调节
function onBlurChange(val: number) {
  themeStore.setBackgroundBlur(val)
}

// 深浅调节（透明度）
function onOpacityChange(val: number) {
  themeStore.setBackgroundOpacity(val)
}

function handleClosed() {
  pwForm.oldPassword = ''
  pwForm.newPassword = ''
  pwForm.confirmPassword = ''
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

defineExpose({ open, close })
</script>

<style scoped lang="scss">
// 抽屉样式
::v-deep(.profile-drawer) {
  .el-drawer__header { display: none; }
  .el-drawer__body { padding: 0; overflow: hidden; }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-bg);

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .header-title { font-size: 16px; font-weight: 600; color: var(--text-color); }
  }

  .close-btn {
    width: 32px; height: 32px;
    border: none; background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer; color: var(--text-secondary);
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast);
    &:hover { background: var(--bg-secondary); color: var(--text-color); }
  }
}

.drawer-body {
  height: calc(100% - 69px);
  overflow-y: auto;
  padding: 20px;
  position: relative;
}

// 用户资料卡
.user-card {
  text-align: center;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;

  .avatar-section {
    position: relative;
    display: inline-block;
    cursor: pointer;
    margin-bottom: 12px;

    .user-avatar {
      border: 3px solid var(--primary-color);
      background: var(--primary-gradient);
      font-size: 24px;
      font-weight: 700;
      transition: all var(--transition-base);
    }

    .avatar-overlay {
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      opacity: 0;
      transition: opacity 0.3s;
      gap: 2px;
    }

    &:hover .avatar-overlay { opacity: 1; }
    &:hover .user-avatar { transform: scale(1.05); }
  }

  .user-info {
    .username { font-size: 18px; font-weight: 700; color: var(--text-color); margin-bottom: 8px; }
    .user-email { font-size: 12px; color: var(--text-tertiary); margin-top: 6px; }
  }
}

// 存储空间
.storage-card {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;

  .storage-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
    .storage-title { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); font-weight: 500; }
    .storage-percent { font-size: 13px; font-weight: 700; color: var(--primary-color);
      &.warn { color: var(--warning-color); }
      &.danger { color: var(--danger-color); }
    }
  }
  .storage-bar {
    height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden; margin-bottom: 8px;
    .storage-fill { height: 100%; border-radius: 4px; background: var(--primary-gradient); transition: width 0.5s ease;
      &.warn { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
      &.danger { background: linear-gradient(135deg,#ef4444,#f87171); }
    }
  }
  .storage-detail { font-size: 11px; color: var(--text-tertiary); text-align: center; }
}

// 菜单
.menu-section {
  .menu-title { font-size: 12px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-left: 4px; }
  .menu-list { display: flex; flex-direction: column; gap: 8px; }
  .menu-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);
    cursor: pointer; transition: all var(--transition-fast);
    &:hover, &.active { background: var(--primary-light);
      span { color: var(--primary-color); }
      .arrow { color: var(--primary-color); transform: translateX(4px); }
    }
    .menu-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    span { flex: 1; font-size: 14px; color: var(--text-color); font-weight: 500; }
    .arrow { color: var(--text-tertiary); transition: all var(--transition-fast); }
  }
}

// 子页面
.sub-page {
  position: absolute; top: 69px; left: 0; right: 0; bottom: 0;
  background: var(--card-bg); z-index: 10; display: flex; flex-direction: column;
}
.sub-page-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border: none; background: var(--bg-secondary);
    border-radius: var(--radius-sm); cursor: pointer;
    color: var(--text-secondary); font-size: 13px; transition: all var(--transition-fast);
    &:hover { background: var(--primary-light); color: var(--primary-color); }
  }
  .sub-page-title { font-size: 15px; font-weight: 600; color: var(--text-color); }
}
.sub-page-content { flex: 1; padding: 20px; overflow-y: auto; }

// 表单
.compact-form {
  :v-deep(.el-form-item) { margin-bottom: 16px;
    .el-form-item__label { font-size: 13px; font-weight: 500; padding-bottom: 6px; }
  }
}
.w-full { width: 100%; }
.mt-2 { margin-top: 8px; }

// 主题设置
.theme-section {
  margin-bottom: 24px;
  h4 { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }
}

// 预设背景网格
.bg-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  .bg-item {
    border: 2px solid var(--border-color); border-radius: var(--radius-md);
    padding: 8px; cursor: pointer; transition: all 0.3s; text-align: center;
    &:hover { border-color: var(--primary-color); }
    &.active { border-color: var(--primary-color); background: rgba(99,102,241,0.05); }
    .bg-preview { width: 100%; height: 50px; border-radius: var(--radius-sm); margin-bottom: 6px; }
    span { font-size: 11px; color: var(--text-secondary); }
  }
}

// 背景调节
.bg-adjust-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  .adjust-item {
    margin-bottom: 16px;
    &:last-child { margin-bottom: 0; }
    .adjust-label {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);
      .adjust-value { font-weight: 600; color: var(--primary-color); }
    }
  }
}

// 分区头部
.section-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
  h4 { margin: 0; }
}

// 历史背景列表
.history-list {
  display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;
}
.history-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-sm);
  transition: all 0.2s;
  &:hover { background: var(--primary-light); }
  .history-preview {
    display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; cursor: pointer;
    .history-thumb {
      width: 40px; height: 30px; border-radius: 4px; flex-shrink: 0;
      background-size: cover; background-position: center;
    }
    .history-info {
      flex: 1; min-width: 0;
      .history-name { display: block; font-size: 12px; color: var(--text-color); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .history-date { display: block; font-size: 10px; color: var(--text-tertiary); margin-top: 2px; }
    }
  }
  .history-remove {
    width: 24px; height: 24px; border: none; background: transparent;
    border-radius: 4px; cursor: pointer; color: var(--text-tertiary);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all 0.2s;
    &:hover { background: rgba(239,68,68,0.1); color: var(--danger-color); }
  }
}

// 活动记录
.activity-list {
  .activity-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px; border-radius: var(--radius-sm); transition: background 0.3s;
    &:hover { background: var(--bg-secondary); }
    .file-icon {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      background: var(--bg-secondary); display: flex;
      align-items: center; justify-content: center;
      color: var(--text-tertiary); flex-shrink: 0;
    }
    .activity-info {
      flex: 1; min-width: 0;
      .file-name { display: block; font-size: 13px; color: var(--text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .file-meta { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
    }
  }
}
</style>
