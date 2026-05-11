import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器 - 添加Token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 统一错误处理
http.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code && data.code >= 400) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }
    return data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作')
      }
      // 400-level errors are handled by the calling component
    } else {
      ElMessage.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

// ===== Auth API =====
export const authApi = {
  login: (data: { username: string; password: string }) => http.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => http.post('/auth/register', data),
  getProfile: () => http.get('/auth/profile'),
  changePassword: (data: { oldPassword: string; newPassword: string }) => http.put('/auth/password', data),
  updateProfile: (data: { username?: string; email?: string }) => http.put('/auth/profile', data),
  uploadAvatar: (formData: FormData) => http.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ===== User API (Admin) =====
export const userApi = {
  getList: (params?: any) => http.get('/users', { params }),
  getById: (id: string) => http.get(`/users/${id}`),
  ban: (id: string) => http.put(`/users/${id}/ban`),
  unban: (id: string) => http.put(`/users/${id}/unban`),
  delete: (id: string) => http.delete(`/users/${id}`),
  updateQuota: (id: string, quota: number) => http.put(`/users/${id}/quota`, null, { params: { quota } }),
}

// ===== Folder API =====
export const folderApi = {
  getTree: (parentId?: string) => http.get('/folders', { params: { parent_id: parentId || '' } }),
  create: (data: { name: string; parent_id?: string }) => http.post('/folders', data),
  update: (id: string, data: { name?: string; parent_id?: string }) => http.put(`/folders/${id}`, data),
  remove: (id: string) => http.delete(`/folders/${id}`),
  togglePin: (id: string) => http.put(`/folders/${id}/pin`),
  setEncrypt: (id: string, password: string) => http.put(`/folders/${id}/encrypt`, { password }),
}

// ===== File API =====
export const fileApi = {
  getList: (params: { folder_id?: string; page?: number; limit?: number }) => http.get('/files', { params }),
  getById: (id: string) => http.get(`/files/${id}`),
  create: (data: any) => http.post('/files', data),
  update: (id: string, data: any) => http.put(`/files/${id}`, data),
  remove: (id: string) => http.delete(`/files/${id}`),
  batchDelete: (ids: string[]) => http.post('/files/batch-delete', { ids }),
  batchDownload: (ids: string[]) => http.post('/files/batch-download', { ids }, { responseType: 'blob' }),
  getDownloadUrl: (id: string) => `/api/files/${id}/download`,
  getPinned: () => http.get('/files/pinned'),
  checkDedup: (hash: string) => http.get('/files/dedup-check', { params: { hash } }),
  getNote: (id: string) => http.get(`/files/${id}/note`),
  saveNote: (id: string, content: string) => http.post(`/files/${id}/note`, { content }),
}

// ===== Upload API =====
export const uploadApi = {
  init: (data: any) => http.post('/upload/init', data),
  uploadChunk: (formData: FormData) =>
    http.post('/upload/chunk', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  merge: (data: any) => http.post('/upload/merge', data),
  simple: (formData: FormData) =>
    http.post('/upload/simple', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }),
  getProgress: (uploadId: string, fileHash: string, totalChunks: number) =>
    http.get(`/upload/progress/${uploadId}`, { params: { file_hash: fileHash, total_chunks: totalChunks } }),
}

// ===== Preview API =====
export const previewApi = {
  getInfo: (fileId: string) => http.get(`/preview/${fileId}/info`),
  getStreamUrl: (fileId: string) => `/api/preview/${fileId}/stream`,
  getShareStreamUrl: (fileId: string) => `/api/preview/share/${fileId}/stream`,
}

// ===== Share API =====
export const shareApi = {
  create: (data: { file_id: string; password?: string; type?: string; expires_at?: string }) => http.post('/shares', data),
  getList: () => http.get('/shares'),
  remove: (id: string) => http.delete(`/shares/${id}`),
  getByCode: (code: string) => http.get(`/s/${code}`),
  verifyCode: (code: string, password: string) => http.post(`/s/${code}/verify`, { password }),
  getDownloadUrl: (code: string, password?: string) => `/api/s/${code}/download?password=${password || ''}`,
}

// ===== Search API =====
export const searchApi = {
  search: (params: { q: string; type?: string; page?: number; limit?: number }) => http.get('/search', { params }),
}

// ===== Tag API =====
export const tagApi = {
  getList: () => http.get('/tags'),
  create: (data: { name: string; color?: string }) => http.post('/tags', data),
  update: (id: string, data: { name?: string; color?: string }) => http.put(`/tags/${id}`, data),
  remove: (id: string) => http.delete(`/tags/${id}`),
}

// ===== Favorite API =====
export const favoriteApi = {
  getList: () => http.get('/favorites'),
  add: (fileId: string) => http.post(`/favorites/${fileId}`),
  remove: (fileId: string) => http.delete(`/favorites/${fileId}`),
}

// ===== Recycle API =====
export const recycleApi = {
  getList: () => http.get('/recycle'),
  restoreFile: (fileId: string) => http.post(`/recycle/file/${fileId}/restore`),
  restoreFolder: (folderId: string) => http.post(`/recycle/folder/${folderId}/restore`),
  permanentDeleteFile: (fileId: string) => http.delete(`/recycle/file/${fileId}`),
  permanentDeleteFolder: (folderId: string) => http.delete(`/recycle/folder/${folderId}`),
  empty: () => http.delete('/recycle'),
}

// ===== Note API =====
export const noteApi = {
  get: (fileId: string) => http.get(`/notes/${fileId}`),
  save: (fileId: string, content: string) => http.post(`/notes/${fileId}`, { content }),
  remove: (fileId: string) => http.delete(`/notes/${fileId}`),
}

// ===== System API (Admin) =====
export const systemApi = {
  getConfigs: () => http.get('/system/configs'),
  updateConfig: (key: string, value: string) => http.put(`/system/configs/${key}`, { value }),
  getStats: () => http.get('/system/stats'),
  getAnalytics: () => http.get('/system/analytics'),
  getBackupStatus: () => http.get('/backup/status'),
  runBackup: () => http.post('/backup/run'),
}

// ===== Activity API =====
export const activityApi = {
  getList: (limit?: number) => http.get('/activities', { params: { limit } }),
}

// ===== Health API =====
export const healthApi = {
  check: () => http.get('/health'),
}

// ===== Announcement API =====
export const announcementApi = {
  getList: () => http.get('/announcements'),
  getUnreadCount: () => http.get('/announcements/unread'),
  markAsRead: (id: string) => http.post(`/announcements/${id}/read`),
  markAllRead: () => http.post('/announcements/read-all'),
  create: (data: { title: string; content: string; level?: string; is_pinned?: boolean }) => http.post('/announcements', data),
  update: (id: string, data: any) => http.put(`/announcements/${id}`, data),
  remove: (id: string) => http.delete(`/announcements/${id}`),
}

export default http
