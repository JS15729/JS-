<template>
  <div class="file-card card-glow" @click="$emit('click')">
    <!-- 缩略图/图标区 -->
    <div class="fc-thumb">
      <img v-if="isImage(file.mime_type)" :src="thumbnailUrl" class="thumb-img" loading="lazy" />
      <video v-else-if="isVideo(file.mime_type)" :src="previewUrl" class="thumb-img" preload="metadata" />
      <div v-else class="thumb-icon" :class="getFileIconClass(file.mime_type)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="isPdf(file.mime_type)">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </template>
          <template v-else-if="file.mime_type?.includes('word')">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </template>
          <template v-else-if="file.mime_type?.includes('excel') || file.mime_type?.includes('spreadsheet')">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/>
          </template>
          <template v-else-if="file.mime_type?.includes('zip') || file.mime_type?.includes('rar')">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </template>
          <template v-else>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </template>
        </svg>
      </div>
      <!-- 类型标签 -->
      <span class="type-badge">{{ fileExt }}</span>
      <!-- 悬浮渐变覆盖层 -->
      <div class="fc-overlay"></div>
    </div>

    <!-- 信息区 -->
    <div class="fc-info">
      <span class="fc-name" :title="file.name">{{ file.name }}</span>
      <span class="fc-meta">
        <span>{{ formatFileSize(file.size) }}</span>
        <span class="meta-dot">·</span>
        <span>{{ formatDate(file.updatedAt || file.createdAt) }}</span>
      </span>
    </div>

    <!-- 悬浮操作 -->
    <div class="fc-actions">
      <button class="fc-btn" title="下载" @click.stop="handleAction('download')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="fc-btn" title="分享" @click.stop="handleAction('share')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>
      <button class="fc-btn" title="重命名" @click.stop="handleAction('rename')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
      </button>
      <button class="fc-btn fc-btn-danger" title="删除" @click.stop="handleAction('delete')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>

    <!-- 标签 -->
    <div class="fc-badges">
      <span v-if="file.is_pinned" class="badge badge-pin">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        置顶
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatFileSize, formatDate, getFileIconClass, isImage, isVideo, isPdf } from '@/utils'
import { previewApi } from '@/api'

const props = defineProps<{ file: any }>()
const emit = defineEmits(['click', 'action'])

const thumbnailUrl = computed(() => (isImage(props.file.mime_type) ? previewApi.getStreamUrl(props.file._id) : ''))
const previewUrl = computed(() => previewApi.getStreamUrl(props.file._id))
const fileExt = computed(() => {
  const parts = (props.file.original_name || props.file.name || '').split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase().slice(0, 4) : 'FILE'
})

function handleAction(type: string) {
  emit('action', type)
}
</script>

<style scoped lang="scss">
.file-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-xl);

    .fc-actions { opacity: 1; transform: translateY(0); }
    .type-badge { opacity: 0; }
    .fc-overlay { opacity: 1; }
    .thumb-icon { transform: scale(1.05); }
  }

  &:active { transform: translateY(-1px); }
}

.fc-thumb {
  position: relative;
  width: 100%;
  height: 130px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .thumb-icon {
    opacity: 0.6;
    transition: all var(--transition-base);
  }

  .fc-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.03) 100%);
    opacity: 0;
    transition: opacity var(--transition-base);
    pointer-events: none;
  }
}

.type-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  color: white;
  letter-spacing: 0.5px;
  transition: opacity var(--transition-base);
}

.fc-info {
  padding: 12px 14px 10px;

  .fc-name {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.4;
    color: var(--text-color);
    font-weight: 500;
    word-break: break-word;
    margin-bottom: 6px;
  }

  .fc-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-tertiary);

    .meta-dot { color: var(--border-color); }
  }
}

.fc-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: linear-gradient(transparent, var(--card-bg) 35%);
  opacity: 0;
  transform: translateY(8px);
  transition: all var(--transition-base);

  .fc-btn {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); border: none;
    background: var(--bg-secondary); color: var(--text-secondary);
    cursor: pointer; transition: all var(--transition-fast);

    &:hover {
      background: var(--primary-color);
      color: white;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
      transform: translateY(-2px);
    }

    &.fc-btn-danger:hover {
      background: var(--danger-color);
      box-shadow: 0 4px 12px rgba(239,68,68,0.3);
    }
  }
}

.fc-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 4px;

  .badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    gap: 3px;
    backdrop-filter: blur(10px);
  }

  .badge-pin {
    background: rgba(245,158,11,0.9);
    color: white;
    box-shadow: 0 2px 8px rgba(245,158,11,0.3);
  }
}
</style>
