/**
 * 工具函数
 */

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
export function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

// 根据MIME类型获取文件图标名称
export function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'Document'
  if (mimeType.startsWith('image/')) return 'Picture'
  if (mimeType.startsWith('video/')) return 'VideoCamera'
  if (mimeType.startsWith('audio/')) return 'Headset'
  if (mimeType === 'application/pdf') return 'Reading'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Grid'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'DataAnalysis'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'FolderOpened'
  if (mimeType.includes('text') || mimeType.includes('javascript') || mimeType.includes('json')) return 'Tickets'
  return 'Document'
}

// 根据MIME类型获取CSS类名
export function getFileIconClass(mimeType: string): string {
  if (!mimeType) return 'file-icon-default'
  if (mimeType.startsWith('image/')) return 'file-icon-image'
  if (mimeType.startsWith('video/')) return 'file-icon-video'
  if (mimeType.startsWith('audio/')) return 'file-icon-audio'
  if (mimeType === 'application/pdf') return 'file-icon-pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-icon-word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-icon-excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-icon-ppt'
  return 'file-icon-default'
}

// 获取文件扩展名
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

// 判断是否为图片
export function isImage(mimeType: string): boolean {
  return mimeType && mimeType.startsWith('image/')
}

// 判断是否为视频
export function isVideo(mimeType: string): boolean {
  return mimeType && mimeType.startsWith('video/')
}

// 判断是否为音频
export function isAudio(mimeType: string): boolean {
  return mimeType && mimeType.startsWith('audio/')
}

// 判断是否为PDF
export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

// 判断是否为Markdown
export function isMarkdown(mimeType: string, filename?: string): boolean {
  if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return true
  if (filename) {
    const ext = getFileExtension(filename)
    return ext === 'md' || ext === 'markdown'
  }
  return false
}

// 判断是否为文本/代码
export function isTextOrCode(mimeType: string): boolean {
  if (!mimeType) return false
  return mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml'
}
