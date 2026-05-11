<template>
  <div class="skeleton-wrapper" :class="type">
    <!-- 卡片骨架 -->
    <template v-if="type === 'card' || type === 'dashboard'">
      <div v-for="i in count" :key="i" class="skeleton-card anim-fade-up" :style="{ animationDelay: (i - 1) * 0.08 + 's' }">
        <div v-if="type === 'dashboard'" class="skeleton-circle"></div>
        <div class="skeleton-line w-30"></div>
        <div class="skeleton-line w-70 h-8"></div>
        <div class="skeleton-line w-50 h-8"></div>
      </div>
    </template>

    <!-- 列表骨架 -->
    <template v-if="type === 'list'">
      <div v-for="i in count" :key="i" class="skeleton-row">
        <div class="skeleton-circle" style="width:32px;height:32px"></div>
        <div style="flex:1">
          <div class="skeleton-line w-50"></div>
          <div class="skeleton-line w-30 h-8"></div>
        </div>
        <div class="skeleton-line w-20" style="width:60px"></div>
      </div>
    </template>

    <!-- 表格骨架 -->
    <template v-if="type === 'table'">
      <div class="skeleton-table-header">
        <div v-for="i in 4" :key="i" class="skeleton-line w-25 h-8" style="margin:0"></div>
      </div>
      <div v-for="i in count" :key="i" class="skeleton-row">
        <div v-for="j in 4" :key="j" class="skeleton-line w-25 h-8" style="margin:0"></div>
      </div>
    </template>

    <!-- 统计骨架 -->
    <template v-if="type === 'stats'">
      <div v-for="i in count" :key="i" class="skeleton-card">
        <div class="skeleton-circle" style="width:36px;height:36px;margin-bottom:8px"></div>
        <div class="skeleton-line w-70 h-20"></div>
        <div class="skeleton-line w-50 h-8"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'card' | 'list' | 'table' | 'stats' | 'dashboard'
  count?: number
}>()
</script>

<style scoped lang="scss">
.skeleton-wrapper {
  &.card, &.dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 14px;
  }
  &.stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  }
  &.list { display: flex; flex-direction: column; gap: 8px; }
  &.table { display: flex; flex-direction: column; gap: 8px; }
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.skeleton-table-header {
  display: flex;
  gap: 0;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  justify-content: space-between;
}
</style>
