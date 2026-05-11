<template>
  <div class="analytics-page page-container">
    <div class="page-header">
      <div class="header-title-group">
        <div class="header-icon" style="background:linear-gradient(135deg,#10b981,#34d399);color:white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
        </div>
        <div>
          <h2>存储分析</h2>
          <p class="header-subtitle">了解你的存储使用情况</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="loadData" :loading="loading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 骨架加载 -->
    <SkeletonLoader v-if="loading" type="stats" :count="4" class="anim-fade-up" />

    <template v-else>
      <!-- 总览卡片 -->
      <div class="bento-grid bento-4 anim-fade-up">
        <div class="bento-card">
          <div class="bento-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/></svg>
          </div>
          <div class="stat-number">{{ analytics.total?.count || 0 }}</div>
          <div class="stat-label-sm">文件总数</div>
        </div>
        <div class="bento-card">
          <div class="bento-icon" style="background:rgba(16,185,129,0.1);color:#10b981">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          </div>
          <div class="stat-number">{{ formatFileSize(analytics.total?.size || 0) }}</div>
          <div class="stat-label-sm">总存储使用</div>
        </div>
        <div class="bento-card">
          <div class="bento-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          <div class="stat-number">{{ typeCount }}</div>
          <div class="stat-label-sm">文件类型</div>
        </div>
        <div class="bento-card">
          <div class="bento-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="stat-number">{{ formatFileSize(avgFileSize) }}</div>
          <div class="stat-label-sm">平均文件大小</div>
        </div>
      </div>

      <!-- 存储分布 + 类型列表 -->
      <div class="bento-grid bento-2 anim-fade-up anim-delay-1">
        <!-- 存储分布可视化 -->
        <div class="bento-card">
          <div class="bento-header">
            <h3>存储分布</h3>
            <span class="bento-badge">按类型</span>
          </div>
          <div class="storage-bars">
            <div v-for="item in storageData" :key="item.label" class="storage-bar-item">
              <div class="bar-header">
                <span class="bar-dot" :style="{ background: item.color }"></span>
                <span class="bar-label">{{ item.label }}</span>
                <span class="bar-value">{{ formatFileSize(item.size) }}</span>
                <span class="bar-pct">{{ item.percent }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
              </div>
              <span class="bar-count">{{ item.count }} 个文件</span>
            </div>
          </div>
        </div>

        <!-- 环形进度图 + 建议 -->
        <div class="bento-card">
          <div class="bento-header">
            <h3>使用占比</h3>
          </div>
          <div class="usage-overview">
            <div class="ring-chart">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-secondary)" stroke-width="10"/>
                <circle v-for="(seg, i) in ringSegments" :key="i"
                  cx="60" cy="60" r="50" fill="none"
                  :stroke="seg.color" stroke-width="10"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="55" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text-color)">{{ analytics.total?.count || 0 }}</text>
                <text x="60" y="70" text-anchor="middle" font-size="10" fill="var(--text-tertiary)">文件总数</text>
              </svg>
              <div class="ring-legend">
                <div v-for="item in storageData.slice(0, 3)" :key="item.label" class="legend-item">
                  <span class="legend-dot" :style="{ background: item.color }"></span>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷建议 -->
      <div class="bento-card anim-fade-up anim-delay-2">
        <div class="bento-header">
          <h3>存储建议</h3>
        </div>
        <div class="tips-grid">
          <div class="tip-item">
            <div class="tip-icon" style="background:rgba(16,185,129,0.1);color:#10b981">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <span class="tip-title">定期清理回收站</span>
              <span class="tip-desc">回收站文件仍占用存储空间，建议定期清空</span>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <span class="tip-title">哈希去重已启用</span>
              <span class="tip-desc">相同文件不会重复存储，放心上传</span>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <span class="tip-title">大文件建议压缩</span>
              <span class="tip-desc">视频和大型文档可压缩后再上传以节省空间</span>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <span class="tip-title">分层存储管理</span>
              <span class="tip-desc">使用文件夹和标签合理组织文件结构</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { systemApi } from '@/api'
import { formatFileSize } from '@/utils'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

type UploadRegisterFn = (fn: () => void) => (() => void) | void
const registerUpload = inject<UploadRegisterFn>('registerUpload')
let unregisterUpload: (() => void) | void = null

onMounted(() => {
  loadData()
  if (registerUpload) {
    unregisterUpload = registerUpload(() => {})
  }
})

const loading = ref(true)
const analytics = ref<any>({ total: { size: 0, count: 0 } })

const categoryColors: Record<string, string> = {
  images: '#10b981',
  videos: '#6366f1',
  audio: '#f59e0b',
  documents: '#3b82f6',
  other: '#94a3b8',
}

const categoryLabels: Record<string, string> = {
  images: '图片',
  videos: '视频',
  audio: '音频',
  documents: '文档',
  other: '其他',
}

const storageData = computed(() => {
  const data = analytics.value
  const total = data.total?.size || 1
  return ['images', 'videos', 'audio', 'documents', 'other']
    .map(k => ({
      key: k,
      label: categoryLabels[k],
      color: categoryColors[k],
      size: data[k]?.size || 0,
      count: data[k]?.count || 0,
      percent: total > 0 ? Math.round(((data[k]?.size || 0) / total) * 100) : 0,
    }))
    .filter(item => item.count > 0)
})

const typeCount = computed(() => storageData.value.length)

const avgFileSize = computed(() => {
  const total = analytics.value.total
  if (!total?.count) return 0
  return total.size / total.count
})

const ringSegments = computed(() => {
  const data = storageData.value
  const circumference = 2 * Math.PI * 50
  let offset = 0
  return data.map(item => {
    const length = (item.percent / 100) * circumference
    const segment = {
      color: item.color,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    }
    offset += length
    return segment
  })
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await systemApi.getAnalytics()
    analytics.value = res.data || res || { total: { size: 0, count: 0 } }
  } catch (e) {
    console.error('加载分析数据失败:', e)
  }
  loading.value = false
}
</script>

<style scoped lang="scss">
.analytics-page {
  padding: 24px;
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

.storage-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .storage-bar-item {
    .bar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .bar-dot {
        width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      }
      .bar-label { font-size: 13px; color: var(--text-color); font-weight: 500; flex: 1; }
      .bar-value { font-size: 13px; color: var(--text-secondary); }
      .bar-pct { font-size: 12px; color: var(--text-tertiary); font-weight: 600; min-width: 36px; text-align: right; }
    }
    .bar-track {
      height: 8px; border-radius: 4px; background: var(--bg-secondary); overflow: hidden; margin-bottom: 4px;
      .bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); min-width: 2px; }
    }
    .bar-count { font-size: 11px; color: var(--text-tertiary); }
  }
}

.usage-overview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;

  .ring-chart {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .ring-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-secondary);

      .legend-dot {
        width: 8px; height: 8px; border-radius: 50%;
      }
    }
  }
}

.tips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) { grid-template-columns: 1fr; }

  .tip-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: var(--bg-muted);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);

    &:hover { background: var(--bg-secondary); }

    .tip-icon {
      width: 36px; height: 36px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .tip-title {
      display: block;
      font-size: 14px; font-weight: 600; color: var(--text-color); margin-bottom: 4px;
    }
    .tip-desc {
      display: block;
      font-size: 12px; color: var(--text-tertiary); line-height: 1.5;
    }
  }
}
</style>
