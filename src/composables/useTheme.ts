import { onScopeDispose, watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'

/**
 * 把设置里的主题偏好落到 <html data-theme> 上。
 *
 * CSS 那边只有两块变量：:root 是浅色，:root[data-theme="dark"] 是深色。
 * 「跟随系统」不写成媒体查询，而是由这里解析成 dark / light 再写进属性 ——
 * 这样手动切换和跟随系统走的是同一条路径。
 */
export function useTheme() {
  const settingsStore = useSettingsStore()
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  function apply() {
    const mode = settingsStore.settings.theme ?? 'system'
    const dark = mode === 'dark' || (mode === 'system' && media.matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  watchEffect(apply)

  // 选了「跟随系统」时，用户中途改系统主题要跟着变
  media.addEventListener('change', apply)
  onScopeDispose(() => media.removeEventListener('change', apply))
}