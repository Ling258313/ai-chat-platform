/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OpenAI 兼容 API 地址 */
  readonly VITE_API_BASE_URL?: string
  /** API Key */
  readonly VITE_API_KEY?: string
  /** 默认模型 */
  readonly VITE_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
