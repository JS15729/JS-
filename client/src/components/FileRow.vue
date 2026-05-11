<template>
  <div class="file-row" @click="$emit('click')">
    <div class="fr-start">
      <img v-if="isImage(file.mime_type)" :src="thumbnailUrl" class="fr-thumb" />
      <div v-else class="fr-icon" :class="getFileIconClass(file.mime_type)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div class="fr-name-group">
        <span class="fr-name">{{ file.name }}</span>
        <span class="fr-badges-row">
          <span v-if="file.is_pinned" class="fr-badge fr-badge-pin">置顶</span>
          <span class="fr-badge fr-badge-ext">{{ fileExt }}</span>
        </span>
      </div>
    </div>

    <div class="fr-mid hide-on-mobile">
      <span class="fr-size">{{ formatFileSize(file.size) }}</span>
    </div>

    <div class="fr-end hide-on-mobile">
      <span class="fr-date">{{ formatDate(file.updatedAt || file.createdAt) }}</span>
    </div>

    <div class="fr-quick-actions">
      <button class="qa-btn" @click.stop="handleAction('download')" title="下载">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="qa-btn" @click.stop="handleAction('share')" title="分享">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>
      <button class="qa-btn" @click.stop="handleAction('rename')" title="重命名">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
      </button>
      <button class="qa-btn" @click.stop="handleAction('more')" title="更多">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatFileSize, formatDate, getFileIconClass, isImage } from '@/utils'
import { previewApi } from '@/api'

const props = defineProps<{ file: any }>()
const emit = defineEmits(['click', 'action'])

const thumbnailUrl = computed(() => (isImage(props.file.mime_type) ? previewApi.getStreamUrl(props.file._id) : ''))
const fileExt = computed(() => {
  const parts = (props.file.original_name || props.file.name || '').split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase().slice(0, 4) : 'FILE'
})

function handleAction(type: string) {
  emit('action', type)
}
</script>

<style scoped lang="scss">
.file-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
  margin-bottom: 1px;

  &:hover {
    background: var(--card-bg-hover);
    box-shadow: var(--shadow-xs);
    .fr-quick-actions { opacity: 1; }
  }
}

.fr-start {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  .fr-thumb {
    width: 36px; height: 36px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .fr-icon {
    width: 36px; height: 36px;
    border-radius: 6px;
    background: var(--bg-secondary);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .fr-name-group {
    min-width: 0;
    display: flex; flex-direction: column; gap: 2px;

    .fr-name {
      font-size: 14px; color: var(--text-color);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
  }
}

.fr-badges-row {
  display: flex; gap: 4px;
  .fr-badge {
    font-size: 10px; font-weight: 600; padding: 1px 6px;
    border-radius: var(--radius-full);
    &.fr-badge-pin { background: rgba(245,158,11,0.15); color: #f59e0b; }
    &.fr-badge-ext { background: var(--bg-secondary); color: var(--text-tertiary); }
  }
}

.fr-mid { width: 80px; text-align: right; }
.fr-end { width: 140px; text-align: right; }

.fr-size, .fr-date { font-size: 13px; color: var(--text-tertiary); }

.fr-quick-actions {
  display: flex; gap: 2px; opacity: 0; transition: opacity var(--transition-fast);

  .qa-btn {
    width: 30px; height: 30px; border: none; border-radius: 6px;
    background: transparent; color: var(--text-tertiary);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast);

    &:hover { background: var(--primary-color); color: white; }
  }
}
</style>
