import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Settings } from '@/types'

const STORAGE_KEY = 'ai-chat-settings'

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  // 安全:仅开发模式允许用环境变量里的 Key 作为默认值。
  // import.meta.env.DEV 在构建时会被替换成字面量 false,整个分支随之被摇掉,
  // 所以生产产物里既没有这个分支、也不会内联 Key。
  // 配套约定:密钥放 .env.development.local(仅 dev 加载),不要放 .env.local(所有模式都加载)。
  apiKey: import.meta.env.DEV ? (import.meta.env.VITE_API_KEY ?? '') : '',
  model: import.meta.env.VITE_MODEL ?? 'deepseek-v4-flash',
  systemPrompt: '你是一个乐于助人的 AI 助手,请用简洁友好的方式回答问题。',
  temperature: 0.7,
  autoSpeak: false,
}

function loadSettings(): Settings {
  // 优先读取 localStorage 中用户显式保存的设置
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {
    // 忽略解析错误,使用默认值
  }
  return { ...DEFAULT_SETTINGS }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadSettings())

  // 持久化到 localStorage
  watch(
    settings,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    },
    { deep: true },
  )

  function updateSettings(patch: Partial<Settings>) {
    settings.value = { ...settings.value, ...patch }
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  return { settings, updateSettings, resetSettings }
})
