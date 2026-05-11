<template>
  <!-- 背景层：只在底层显示背景，不影响内容 -->
  <div id="app-background"></div>
  <router-view />
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
themeStore.initTheme()
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; }
#app { width: 100%; height: 100vh; position: relative; overflow: hidden; }
a { text-decoration: none; color: inherit; }

/* 背景层：固定在底层，不影响内容 */
#app-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

/* 确保路由视图在背景层之上 */
#app > router-view {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
</style>
