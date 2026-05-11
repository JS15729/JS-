import { defineStore } from 'pinia'
import { ref } from 'vue'

// 背景历史记录接口
export interface BackgroundRecord {
  id: string
  name: string
  type: 'preset' | 'custom'
  value: string       // 预设值 或 data URL
  preview?: string    // 预览样式
  addedAt: number    // 添加时间戳
}

// 预设背景
const presetBackgrounds: Record<string, string> = {
  'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'dark': '#0f172a',
  'stars': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'ocean': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'forest': 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  // 背景相关状态
  const backgroundType = ref<'default' | 'preset' | 'custom'>(
    (localStorage.getItem('bg_type') as any) || 'default'
  )
  const backgroundValue = ref(localStorage.getItem('bg_value') || '')
  const backgroundBrightness = ref(Number(localStorage.getItem('bg_brightness')) || 100)
  const backgroundBlur = ref(Number(localStorage.getItem('bg_blur')) || 0)
  const backgroundOpacity = ref(Number(localStorage.getItem('bg_opacity')) || 100) // 背景透明度（深浅）
  const backgroundHistory = ref<BackgroundRecord[]>(loadBackgroundHistory())

  // ========= 背景历史 =========
  function loadBackgroundHistory(): BackgroundRecord[] {
    try {
      const data = localStorage.getItem('bg_history')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  function saveBackgroundHistory() {
    localStorage.setItem('bg_history', JSON.stringify(backgroundHistory.value))
  }

  function addToHistory(record: BackgroundRecord) {
    backgroundHistory.value = backgroundHistory.value.filter(r => r.id !== record.id)
    backgroundHistory.value.unshift(record)
    if (backgroundHistory.value.length > 20) {
      backgroundHistory.value = backgroundHistory.value.slice(0, 20)
    }
    saveBackgroundHistory()
  }

  function removeFromHistory(id: string) {
    backgroundHistory.value = backgroundHistory.value.filter(r => r.id !== id)
    saveBackgroundHistory()
  }

  // ========= 暗黑模式 =========
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  function applyTheme() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // ========= 背景核心 =========
  function setBackground(type: 'default' | 'preset' | 'custom', value: string) {
    backgroundType.value = type
    backgroundValue.value = value
    localStorage.setItem('bg_type', type)
    localStorage.setItem('bg_value', value)
    applyBackground()
  }

  function setBackgroundBrightness(brightness: number) {
    backgroundBrightness.value = Math.max(0, Math.min(100, brightness))
    localStorage.setItem('bg_brightness', String(backgroundBrightness.value))
    applyBackground()
  }

  function setBackgroundBlur(blur: number) {
    backgroundBlur.value = Math.max(0, Math.min(20, blur))
    localStorage.setItem('bg_blur', String(backgroundBlur.value))
    applyBackground()
  }

  function setBackgroundOpacity(opacity: number) {
    backgroundOpacity.value = Math.max(0, Math.min(100, opacity))
    localStorage.setItem('bg_opacity', String(backgroundOpacity.value))
    applyBackground()
  }

  function resetBackground() {
    backgroundType.value = 'default'
    backgroundValue.value = ''
    localStorage.setItem('bg_type', 'default')
    localStorage.setItem('bg_value', '')
    applyBackground()
  }

  function initTheme() {
    applyTheme()
    // 延迟确保 DOM 已就绪
    setTimeout(() => applyBackground(), 200)
  }

  // ★ 核心：操作 #app-background 元素，不影响内容层
  function applyBackground() {
    const bgEl = document.getElementById('app-background')
    if (!bgEl) {
      console.log('[applyBackground] 未找到 #app-background 元素')
      setTimeout(() => applyBackground(), 300)
      return
    }

    console.log('[applyBackground] type=' + backgroundType.value + ', value=' + backgroundValue.value)

    // 清除所有背景相关样式
    bgEl.style.backgroundImage = ''
    bgEl.style.backgroundColor = ''
    bgEl.style.background = ''
    bgEl.style.filter = ''
    bgEl.style.opacity = ''

    if (backgroundType.value === 'default') {
      // 恢复默认：清除背景层
      bgEl.style.display = 'none'
      console.log('[applyBackground] 已恢复默认背景')
      return
    }

    // 显示背景层
    bgEl.style.display = 'block'

    // 构建 CSS filter（亮度 + 模糊）— 只应用在背景层
    const bVal = Math.max(0.05, backgroundBrightness.value / 100)
    const filters: string[] = [`brightness(${bVal})`]
    if (backgroundBlur.value > 0) {
      filters.push(`blur(${backgroundBlur.value}px)`)
    }
    bgEl.style.filter = filters.join(' ')

    // 背景透明度（深浅调节）
    const opacityVal = backgroundOpacity.value / 100
    bgEl.style.opacity = String(opacityVal)

    if (backgroundType.value === 'preset') {
      const bg = presetBackgrounds[backgroundValue.value] || ''
      if (!bg) {
        console.log('[applyBackground] 未找到预设背景:', backgroundValue.value)
        return
      }
      console.log('[applyBackground] 预设背景:', bg.slice(0, 60))
      if (bg.startsWith('#')) {
        bgEl.style.backgroundColor = bg
        bgEl.style.backgroundImage = 'none'
        bgEl.style.backgroundSize = 'cover'
        bgEl.style.backgroundPosition = 'center'
        bgEl.style.backgroundRepeat = 'no-repeat'
      } else {
        bgEl.style.background = bg
        bgEl.style.backgroundSize = 'cover'
        bgEl.style.backgroundPosition = 'center'
        bgEl.style.backgroundRepeat = 'no-repeat'
      }
    } else if (backgroundType.value === 'custom') {
      if (backgroundValue.value) {
        const url = backgroundValue.value
        console.log('[applyBackground] 自定义背景，URL 长度:', url.length)
        bgEl.style.backgroundImage = `url(${url})`
        bgEl.style.backgroundSize = 'cover'
        bgEl.style.backgroundPosition = 'center'
        bgEl.style.backgroundRepeat = 'no-repeat'
        bgEl.style.backgroundColor = 'transparent'
        console.log('[applyBackground] 已设置自定义背景')
      }
    }
  }

  return {
    isDark,
    backgroundType,
    backgroundValue,
    backgroundBrightness,
    backgroundBlur,
    backgroundOpacity,
    backgroundHistory,
    toggleTheme,
    setBackground,
    setBackgroundBrightness,
    setBackgroundBlur,
    setBackgroundOpacity,
    resetBackground,
    addToHistory,
    removeFromHistory,
    initTheme,
    applyBackground,
  }
})
