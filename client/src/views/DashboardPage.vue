<template>
  <div class="files-page page-container">
    <!-- 顶栏 -->
    <div class="page-header">
      <div class="header-title-group">
        <div class="header-icon" style="background:linear-gradient(135deg,#3b82f6,#6366f1);color:white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </div>
        <div>
          <h2>我的文件</h2>
          <p class="header-subtitle">{{ total }} 个文件</p>
        </div>
      </div>
      <div class="header-actions">
        <!-- 排序下拉 -->
        <el-dropdown @command="onSortChange" trigger="click">
          <el-button size="default">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
            {{ sortLabel }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="createdAt_desc">最新上传</el-dropdown-item>
              <el-dropdown-item command="createdAt_asc">最早上传</el-dropdown-item>
              <el-dropdown-item command="name_asc">名称 A→Z</el-dropdown-item>
              <el-dropdown-item command="name_desc">名称 Z→A</el-dropdown-item>
              <el-dropdown-item command="size_desc">大小 大→小</el-dropdown-item>
              <el-dropdown-item command="size_asc">大小 小→大</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 文件类型筛选 -->
        <el-dropdown @command="onTypeFilter" trigger="click">
          <el-button size="default">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {{ typeFilterLabel }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="all">全部类型</el-dropdown-item>
              <el-dropdown-item command="image">图片</el-dropdown-item>
              <el-dropdown-item command="video">视频</el-dropdown-item>
              <el-dropdown-item command="audio">音频</el-dropdown-item>
              <el-dropdown-item command="document">文档</el-dropdown-item>
              <el-dropdown-item command="archive">压缩包</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button-group class="view-toggle">
          <el-button :type="viewMode === 'grid' ? 'primary' : ''" size="default" @click="viewMode = 'grid'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </el-button>
          <el-button :type="viewMode === 'list' ? 'primary' : ''" size="default" @click="viewMode = 'list'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </el-button>
        </el-button-group>
        <el-button type="primary" @click="showUpload = true" class="btn-gradient">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          上传文件
        </el-button>
        <el-button @click="showNewFolder = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          新建文件夹
        </el-button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <transition name="batch-bar">
      <div class="batch-bar" v-if="selectedIds.size > 0">
        <div class="batch-info">
          <el-checkbox :indeterminate="selectedIds.size > 0 && selectedIds.size < files.length" :model-value="selectedIds.size === files.length && files.length > 0" @change="toggleSelectAll">全选</el-checkbox>
          <span class="batch-count">已选 {{ selectedIds.size }} 个文件</span>
        </div>
        <div class="batch-actions">
          <el-button size="small" @click="batchDownload" :loading="batchDownloading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ batchDownloading ? '打包中...' : 'ZIP下载' }}
          </el-button>
          <el-button size="small" type="danger" @click="batchDelete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            批量删除
          </el-button>
          <el-button size="small" @click="selectedIds.clear(); selectedIds = new Set()">取消选择</el-button>
        </div>
      </div>
    </transition>

    <!-- 文件夹面包屑导航 -->
    <div class="breadcrumb-bar anim-fade-up">
      <!-- 返回根目录按钮 -->
      <button class="bc-item bc-home" @click="goRoot" :class="{ active: !currentFolder }">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        根目录
      </button>
      
      <!-- 面包屑路径 -->
      <template v-for="(b, i) in breadcrumbs" :key="b.id">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="bc-arrow"><polyline points="9 18 15 12 9 6"/></svg>
        <button class="bc-item" :class="{ active: i === breadcrumbs.length - 1 }" @click="goToBreadcrumb(i)">
          {{ b.name }}
        </button>
      </template>
      
      <!-- 当前文件夹信息 -->
      <span class="bc-info" v-if="currentFolder">
        · {{ subFolders.length }} 个文件夹 · {{ files.length }} 个文件
      </span>
    </div>

    <!-- 快速文件夹导航 -->
    <div class="folder-pills anim-fade-up" v-if="subFolderPills.length > 0">
      <button class="pill" :class="{ active: !currentFolder }" @click="currentFolder = null">全部</button>
      <button v-for="f in subFolderPills" :key="f.id" class="pill" :class="{ active: currentFolder === f.id }" @click="currentFolder = f.id">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        {{ f.name }}
      </button>
    </div>

    <!-- 置顶文件区域 -->
    <div class="section-block anim-fade-up anim-delay-1" v-if="pinnedFiles.length > 0 && !currentFolder">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        置顶文件
      </div>
      <div class="file-grid" v-if="viewMode === 'grid'">
        <div v-for="file in pinnedFiles" :key="file._id" class="file-card-wrap" :class="{ selected: selectedIds.has(file._id) }">
          <el-checkbox class="card-checkbox" :model-value="selectedIds.has(file._id)" @change="toggleSelect(file._id)" @click.stop />
          <FileCard :file="file" @click="onFileClick(file, $event)" @action="(t: string) => handleFileAction(t, file)" />
        </div>
      </div>
      <div class="file-list-wrap" v-else>
        <FileRow v-for="file in pinnedFiles" :key="file._id" :file="file" @click="previewFile(file)" @action="(t: string) => handleFileAction(t, file)" />
      </div>
    </div>

    <!-- 子文件夹 -->
    <div class="section-block anim-fade-up anim-delay-1" v-if="subFolders.length > 0">
      <div class="section-label">
        文件夹 ({{ subFolders.length }})
      </div>
      <div class="folder-grid">
        <div v-for="folder in subFolders" :key="folder.id" class="folder-card card-hover" @click="enterFolder(folder)" @contextmenu.prevent="showFolderCtx($event, folder)" @dblclick="enterFolder(folder)">
          <div class="folder-visual">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <span class="folder-name" :title="folder.name">{{ folder.name }}</span>
          <span class="folder-badge" v-if="folder.children && folder.children.length > 0">
            {{ folder.children.length }}个子项
          </span>
          <div class="folder-actions">
            <button class="folder-action-btn" @click.stop="renameFolder(folder)" title="重命名">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="folder-action-btn folder-del-btn" @click.stop="deleteFolder(folder)" title="删除文件夹">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件列表 / 空状态 -->
    <div class="section-block anim-fade-up anim-delay-2">
      <div class="section-header-row">
        <div class="section-label">文件 ({{ filteredFiles.length }})</div>
        <div class="select-all-btn" v-if="filteredFiles.length > 0" @click="toggleSelectAll(!isAllSelected)">
          <el-checkbox :model-value="isAllSelected" :indeterminate="isPartialSelected" @change="toggleSelectAll">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </el-checkbox>
        </div>
      </div>
      <div v-if="filteredFiles.length === 0" class="empty-files">
        <div class="empty-illustration">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
        </div>
        <p>此文件夹为空</p>
        <el-button type="primary" @click="showUpload = true">上传第一个文件</el-button>
      </div>
      <div class="file-grid" v-else-if="viewMode === 'grid'">
        <div v-for="(file, idx) in filteredFiles" :key="file._id" class="file-card-wrap anim-fade-up" :class="{ selected: selectedIds.has(file._id) }" :style="{ animationDelay: idx * 0.03 + 's' }">
          <el-checkbox class="card-checkbox" :model-value="selectedIds.has(file._id)" @change="toggleSelect(file._id)" @click.stop />
          <FileCard :file="file" @click="onFileClick(file, $event)" @action="(t: string) => handleFileAction(t, file)" />
        </div>
      </div>
      <div class="file-list-wrap" v-else>
        <FileRow v-for="file in filteredFiles" :key="file._id" :file="file"
          @click="previewFile(file)" @action="(t: string) => handleFileAction(t, file)" />
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-bar" v-if="total > pageSize">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total"
        layout="prev, pager, next" background @current-change="loadFiles" />
    </div>

    <!-- 对话框 -->
    <el-dialog v-model="showNewFolder" title="新建文件夹" width="420px">
      <el-input v-model="newFolderName" placeholder="文件夹名称" size="large" @keyup.enter="createFolder">
        <template #prefix><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></template>
      </el-input>
      <template #footer>
        <el-button @click="showNewFolder = false">取消</el-button>
        <el-button type="primary" @click="createFolder">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="showRename" title="重命名" width="420px">
      <el-input v-model="renameValue" placeholder="输入新名称" size="large" @keyup.enter="doRename">
        <template #prefix><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></template>
      </el-input>
      <template #footer>
        <el-button @click="showRename = false">取消</el-button>
        <el-button type="primary" @click="doRename">确认</el-button>
      </template>
    </el-dialog>

    <FileUploader v-model:visible="showUpload" :folder-id="currentFolder || undefined" @success="onUploadSuccess" />
    <FilePreview v-model:visible="showPreview" :file="previewFileData" />
    <ShareDialog v-model:visible="showShareDialog" :file-id="contextFile?._id || ''" />

    <!-- 右键菜单 -->
    <Teleport to="body">
      <!-- 文件右键菜单 -->
      <div v-if="ctx.visible && contextFile" class="context-menu glass-panel" :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }">
        <button @click="previewFile(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>预览</button>
        <button @click="downloadFile(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>下载</button>
        <button @click="showShareDialog = true; ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/></svg>分享</button>
        <button @click="togglePin(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>{{ contextFile?.is_pinned ? '取消置顶' : '置顶' }}</button>
        <button @click="toggleFavorite(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{{ isFav(contextFile) ? '取消收藏' : '收藏' }}</button>
        <div class="ctx-divider"></div>
        <button @click="renameFile(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>重命名</button>
        <button class="ctx-danger" @click="deleteFile(contextFile); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>删除</button>
      </div>
      <!-- 文件夹右键菜单 -->
      <div v-if="ctx.visible && contextFolder" class="context-menu glass-panel" :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }">
        <button @click="enterFolder(contextFolder); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>打开文件夹</button>
        <div class="ctx-divider"></div>
        <button @click="renameFolder(contextFolder); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>重命名</button>
        <button class="ctx-danger" @click="deleteFolder(contextFolder); ctx.visible=false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>删除</button>
      </div>
    </Teleport>
    <div v-if="ctx.visible" class="context-mask" @click="ctx.visible = false" @contextmenu.prevent="ctx.visible = false"></div>

    <!-- 文件夹重命名对话框 -->
    <el-dialog v-model="showFolderRename" title="重命名文件夹" width="420px">
      <el-input v-model="folderRenameValue" placeholder="输入新名称" size="large" @keyup.enter="doFolderRename">
        <template #prefix><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></template>
      </el-input>
      <template #footer>
        <el-button @click="showFolderRename = false">取消</el-button>
        <el-button type="primary" @click="doFolderRename">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { folderApi, fileApi, favoriteApi } from '@/api'
import FileCard from '@/components/FileCard.vue'
import FileRow from '@/components/FileRow.vue'
import FileUploader from '@/components/FileUploader.vue'
import FilePreview from '@/components/FilePreview.vue'
import ShareDialog from '@/components/ShareDialog.vue'

// 注册上传触发器到 Layout（使导航栏上传按钮可用）
type UploadRegisterFn = (fn: () => void) => (() => void) | void
const registerUpload = inject<UploadRegisterFn>('registerUpload')
let unregisterUpload: (() => void) | void = null

const route = useRoute()
const viewMode = ref<'grid' | 'list'>('grid')
const currentFolder = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 30
const files = ref<any[]>([])
const total = ref(0)
const folderTree = ref<any[]>([])
const subFolders = ref<any[]>([])
const pinnedFiles = ref<any[]>([])
const favIds = ref<Set<string>>(new Set())
const showUpload = ref(false)
const showNewFolder = ref(false)
const newFolderName = ref('')
const showRename = ref(false)
const renameValue = ref('')
const renameFileId = ref('')
const showPreview = ref(false)
const previewFileData = ref<any>(null)
const showShareDialog = ref(false)
const contextFile = ref<any>(null)
const contextFolder = ref<any>(null)
const showFolderRename = ref(false)
const folderRenameValue = ref('')
const folderRenameId = ref('')
const batchDownloading = ref(false)

// 排序与筛选
const sortKey = ref('createdAt_desc')
const typeFilter = ref('all')
let selectedIds = ref<Set<string>>(new Set())

const sortLabel = computed(() => {
  const map: Record<string, string> = {
    createdAt_desc: '最新上传', createdAt_asc: '最早上传',
    name_asc: '名称 A→Z', name_desc: '名称 Z→A',
    size_desc: '大小 大→小', size_asc: '大小 小→大',
  }
  return map[sortKey.value] || '排序'
})

const typeFilterLabel = computed(() => {
  const map: Record<string, string> = {
    all: '全部类型', image: '图片', video: '视频',
    audio: '音频', document: '文档', archive: '压缩包',
  }
  return map[typeFilter.value] || '类型'
})

const filteredFiles = computed(() => {
  let list = [...files.value]
  // 类型筛选
  if (typeFilter.value !== 'all') {
    list = list.filter(f => {
      const mime = f.mime_type || ''
      switch (typeFilter.value) {
        case 'image': return mime.startsWith('image/')
        case 'video': return mime.startsWith('video/')
        case 'audio': return mime.startsWith('audio/')
        case 'document': return mime.includes('pdf') || mime.includes('word') || mime.includes('excel') || mime.includes('text') || mime.includes('spreadsheet') || mime.includes('presentation')
        case 'archive': return mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('gz') || mime.includes('7z')
        default: return true
      }
    })
  }
  // 排序
  const [key, dir] = sortKey.value.split('_')
  list.sort((a, b) => {
    let va = a[key], vb = b[key]
    if (key === 'createdAt' || key === 'updatedAt') { va = new Date(va).getTime(); vb = new Date(vb).getTime() }
    if (key === 'name') { va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase() }
    if (dir === 'asc') return va > vb ? 1 : -1
    return va < vb ? 1 : -1
  })
  return list
})

const isAllSelected = computed(() => filteredFiles.value.length > 0 && filteredFiles.value.every(f => selectedIds.value.has(f._id)))
const isPartialSelected = computed(() => selectedIds.value.size > 0 && !isAllSelected.value)

const ctx = reactive({ visible: false, x: 0, y: 0 })

const breadcrumbs = computed(() => {
  if (!currentFolder.value) return []
  const findPath = (items: any[], target: string, path: any[] = []): any[] | null => {
    for (const item of items) {
      if (item.id === target) return [...path, item]
      if (item.children?.length) {
        const result = findPath(item.children, target, [...path, item])
        if (result) return result
      }
    }
    return null
  }
  return findPath(folderTree.value, currentFolder.value) || []
})

const subFolderPills = computed(() => subFolders.value.slice(0, 8))

function isFav(file: any) {
  return file && favIds.value.has(file._id?.toString())
}

// 文件夹导航
function enterFolder(folder: any) {
  currentFolder.value = folder.id
}

function goRoot() {
  currentFolder.value = null
}

function goToBreadcrumb(index: number) {
  if (index >= 0 && index < breadcrumbs.value.length) {
    currentFolder.value = breadcrumbs.value[index].id
  }
}

onMounted(() => {
  loadAll()
  document.addEventListener('click', closeCtx)
  // 注册上传触发函数，让 Layout 的导航栏上传按钮可以打开本页上传对话框
  if (registerUpload) {
    unregisterUpload = registerUpload(() => { showUpload.value = true })
  }
  // 处理 URL query 参数（从首页点击文件夹跳转过来）
  const folderId = route.query.folderId as string
  if (folderId) {
    currentFolder.value = folderId
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeCtx)
  // 取消注册上传触发器，避免 Layout 调用已卸载的组件方法
  if (unregisterUpload) {
    unregisterUpload()
    unregisterUpload = null
  }
})

function closeCtx() { ctx.visible = false }

watch(currentFolder, () => {
  currentPage.value = 1
  selectedIds.value = new Set()
  loadFiles()
  loadSubFolders()
})

async function loadAll() {
  loadFolderTree()
  loadFiles()
  loadSubFolders()
  loadPinned()
  loadFavs()
}

async function loadFolderTree() {
  try { const r: any = await folderApi.getTree(); folderTree.value = r.data || [] } catch (e) { /* */ }
}
async function loadFiles() {
  try {
    const p: any = { page: currentPage.value, limit: pageSize }
    if (currentFolder.value) p.folder_id = currentFolder.value
    const r: any = await fileApi.getList(p)
    files.value = r.data?.list || []
    total.value = r.data?.total || 0
  } catch (e) { /* */ }
}
async function loadSubFolders() {
  try { const r: any = await folderApi.getTree(currentFolder.value || undefined); subFolders.value = r.data || [] } catch (e) { subFolders.value = [] }
}
async function loadPinned() {
  try { const r: any = await fileApi.getPinned(); pinnedFiles.value = r.data || [] } catch (e) { /* */ }
}
async function loadFavs() {
  try { const r: any = await favoriteApi.getList(); favIds.value = new Set((r.data || []).map((f: any) => f._id?.toString())) } catch (e) { /* */ }
}

async function createFolder() {
  if (!newFolderName.value.trim()) return ElMessage.warning('请输入文件夹名称')
  try {
    await folderApi.create({ name: newFolderName.value.trim(), parent_id: currentFolder.value || undefined })
    ElMessage.success('文件夹已创建')
    showNewFolder.value = false
    newFolderName.value = ''
    loadFolderTree(); loadSubFolders()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '创建失败') }
}

async function deleteFolder(folder: any) {
  try {
    await ElMessageBox.confirm(`确定删除文件夹「${folder.name}」？其中的文件也将移入回收站。`, '确认删除', { type: 'warning', confirmButtonText: '删除' })
    await folderApi.remove(folder.id)
    ElMessage.success('文件夹已删除')
    loadFolderTree(); loadSubFolders(); loadFiles()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

function renameFile(file: any) {
  if (!file) return
  renameFileId.value = file._id
  renameValue.value = file.name
  showRename.value = true
}

async function doRename() {
  if (!renameValue.value.trim()) return ElMessage.warning('请输入文件名称')
  try {
    await fileApi.update(renameFileId.value, { name: renameValue.value.trim() })
    ElMessage.success('文件已重命名')
    showRename.value = false
    loadFiles(); loadPinned()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '重命名失败') }
}

function onUploadSuccess() {
  showUpload.value = false
  loadFiles(); loadPinned(); loadSubFolders(); loadFolderTree()
}

function previewFile(file: any) {
  previewFileData.value = file
  showPreview.value = true
}

function downloadFile(file: any) {
  if (!file) return
  window.open(fileApi.getDownloadUrl(file._id), '_blank')
}

async function togglePin(file: any) {
  try {
    await fileApi.update(file._id, { is_pinned: !file.is_pinned })
    ElMessage.success(file.is_pinned ? '已取消置顶' : '已置顶')
    loadFiles(); loadPinned()
  } catch (e: any) { ElMessage.error('操作失败') }
}

async function toggleFavorite(file: any) {
  try {
    if (isFav(file)) {
      await favoriteApi.remove(file._id)
      favIds.value.delete(file._id?.toString())
      ElMessage.success('已取消收藏')
    } else {
      await favoriteApi.add(file._id)
      favIds.value.add(file._id?.toString())
      ElMessage.success('已收藏')
    }
  } catch (e: any) { ElMessage.error('操作失败') }
}

async function deleteFile(file: any) {
  try {
    await ElMessageBox.confirm(`确定删除「${file.name}」？文件将移入回收站。`, '确认删除', { type: 'warning', confirmButtonText: '删除' })
    await fileApi.remove(file._id)
    ElMessage.success('已移入回收站')
    loadFiles(); loadPinned()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

function handleFileAction(type: string, file: any) {
  contextFile.value = file
  switch (type) {
    case 'download': downloadFile(file); break
    case 'share': showShareDialog.value = true; break
    case 'rename': renameFile(file); break
    case 'delete': deleteFile(file); break
    case 'more': break
  }
}

function showContextMenu(e: MouseEvent, file: any) {
  contextFile.value = file
  ctx.visible = true
  ctx.x = Math.min(e.clientX, window.innerWidth - 200)
  ctx.y = Math.min(e.clientY, window.innerHeight - 280)
}

function showFolderCtx(e: MouseEvent, folder: any) {
  contextFolder.value = folder
  ctx.visible = true
  ctx.x = Math.min(e.clientX, window.innerWidth - 200)
  ctx.y = Math.min(e.clientY, window.innerHeight - 280)
}

function renameFolder(folder: any) {
  if (!folder) return
  folderRenameId.value = folder.id
  folderRenameValue.value = folder.name
  showFolderRename.value = true
}

async function doFolderRename() {
  if (!folderRenameValue.value.trim()) return ElMessage.warning('请输入文件夹名称')
  try {
    await folderApi.update(folderRenameId.value, { name: folderRenameValue.value.trim() })
    ElMessage.success('文件夹已重命名')
    showFolderRename.value = false
    loadFolderTree(); loadSubFolders()
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '重命名失败') }
}

// 排序和筛选
function onSortChange(cmd: string) { sortKey.value = cmd }
function onTypeFilter(cmd: string) { typeFilter.value = cmd }

// 选择管理
function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  selectedIds.value = s
}

function toggleSelectAll(val?: boolean) {
  if (val === undefined) val = !isAllSelected.value
  if (val) {
    selectedIds.value = new Set(filteredFiles.value.map(f => f._id))
  } else {
    selectedIds.value = new Set()
  }
}

// 点击文件：shift/ctrl 多选，否则预览
function onFileClick(file: any, e?: MouseEvent) {
  if (e && (e.ctrlKey || e.metaKey || e.shiftKey)) {
    toggleSelect(file._id)
  } else if (selectedIds.value.size > 0) {
    toggleSelect(file._id)
  } else {
    previewFile(file)
  }
}

// 批量操作
async function batchDelete() {
  if (selectedIds.value.size === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.size} 个文件？文件将移入回收站。`, '批量删除', { type: 'warning', confirmButtonText: '全部删除' })
    await fileApi.batchDelete([...selectedIds.value])
    ElMessage.success(`已将 ${selectedIds.value.size} 个文件移入回收站`)
    selectedIds.value = new Set()
    loadFiles(); loadPinned()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('批量删除失败')
  }
}

async function batchDownload() {
  if (selectedIds.value.size === 0) return
  if (selectedIds.value.size === 1) {
    const id = [...selectedIds.value][0]
    window.open(fileApi.getDownloadUrl(id), '_blank')
    return
  }
  batchDownloading.value = true
  try {
    const response: any = await fileApi.batchDownload([...selectedIds.value])
    const blob = response.data || response
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'files_' + Date.now() + '.zip'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已打包下载 ' + selectedIds.value.size + ' 个文件')
  } catch (e: any) {
    ElMessage.error('批量下载失败，切换为逐个下载')
    ;[...selectedIds.value].forEach(id => {
      const a = document.createElement('a')
      a.href = fileApi.getDownloadUrl(id)
      a.target = '_blank'
      a.click()
    })
  }
  batchDownloading.value = false
}
</script>

<style scoped lang="scss">
.files-page { padding: 24px; height: calc(100vh - var(--header-height)); overflow-y: auto; }

// 批量操作栏
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1));
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;

  .batch-info {
    display: flex;
    align-items: center;
    gap: 12px;
    .batch-count { font-size: 13px; color: var(--primary-color); font-weight: 600; }
  }
  .batch-actions { display: flex; gap: 8px; flex-wrap: wrap; }
}

.batch-bar-enter-active, .batch-bar-leave-active { transition: all var(--transition-base); }
.batch-bar-enter-from, .batch-bar-leave-to { opacity: 0; transform: translateY(-10px); }

.breadcrumb-bar {
  display: flex; align-items: center; gap: 4px;
  padding: 10px 16px; margin-bottom: 16px;
  background: var(--card-bg); border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
  .bc-item {
    padding: 4px 10px; border-radius: var(--radius-sm);
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; color: var(--text-secondary);
    display: flex; align-items: center; gap: 4px;
    transition: all var(--transition-fast);
    &:hover { background: var(--bg-secondary); color: var(--text-color); }
    &.active { color: var(--primary-color); font-weight: 600; }
    &.bc-home { color: var(--text-color); }
    &.bc-home.active { color: var(--primary-color); font-weight: 700; }
  }
  .bc-arrow { color: var(--text-tertiary); flex-shrink: 0; margin: 0 2px; }
  .bc-info {
    margin-left: auto; font-size: 12px; color: var(--text-tertiary);
  }
}

.folder-pills {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
  .pill {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 14px; border-radius: var(--radius-full);
    border: 1px solid var(--border-color); background: var(--card-bg);
    cursor: pointer; font-size: 13px; color: var(--text-secondary);
    transition: all var(--transition-fast);
    &:hover { border-color: var(--primary-light); color: var(--primary-color); }
    &.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }
  }
}

.section-block { margin-bottom: 24px; }

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .select-all-btn {
    cursor: pointer;
    .el-checkbox { pointer-events: none; }
  }
}

.section-label {
  font-size: 13px; font-weight: 600; color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 6px;
}

// 文件夹卡片
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  .folder-card {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 20px 12px 12px; background: var(--card-bg);
    border: 1px solid var(--border-color); border-radius: var(--radius-md);
    cursor: pointer; text-align: center;
    position: relative;
    .folder-visual { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,0.1); border-radius: var(--radius-sm); }
    .folder-name { font-size: 13px; color: var(--text-color); word-break: break-all; line-height: 1.3; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
    .folder-badge {
      font-size: 10px; color: var(--text-tertiary); background: var(--bg-secondary);
      padding: 2px 6px; border-radius: var(--radius-full);
    }
    .folder-actions {
      position: absolute; top: 6px; right: 6px;
      display: flex; gap: 4px;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }
    .folder-action-btn {
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--transition-fast);
      &:hover { background: var(--primary-color); color: white; border-color: var(--primary-color); }
      &.folder-del-btn:hover { background: var(--danger-color); border-color: var(--danger-color); }
    }
    &:hover .folder-actions { opacity: 1; }
  }
}

// 文件卡片包装（支持选择）
.file-card-wrap {
  position: relative;

  .card-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
  }

  &:hover .card-checkbox,
  &.selected .card-checkbox { opacity: 1; pointer-events: all; }

  &.selected {
    .file-card {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(99,102,241,0.25);
      background: rgba(99,102,241,0.04);
    }
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
  @media (max-width: 640px) { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
}

.file-list-wrap { display: flex; flex-direction: column; }

.empty-files {
  text-align: center; padding: 60px 20px;
  .empty-illustration { margin-bottom: 16px; color: var(--text-tertiary); }
  p { color: var(--text-secondary); margin-bottom: 16px; font-size: 15px; }
}

.pagination-bar { display: flex; justify-content: center; margin-top: 24px; }

// 右键菜单
.context-menu {
  position: fixed; z-index: 9999;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  min-width: 180px; padding: 6px;

  button {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 8px 14px; border: none; border-radius: 6px;
    background: transparent; cursor: pointer; font-size: 13px; color: var(--text-color);
    transition: all var(--transition-fast);
    &:hover { background: var(--bg-secondary); }
  }
  .ctx-danger { color: var(--danger-color); &:hover { background: rgba(239,68,68,0.1); } }
  .ctx-divider { height: 1px; background: var(--border-color); margin: 4px 8px; }
}

.context-mask { position: fixed; inset: 0; z-index: 9998; }
</style>
