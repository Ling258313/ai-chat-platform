/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 单条消息 */
export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  /** 是否正在流式输出 */
  isStreaming?: boolean
  /** 错误信息 */
  error?: string
  /** 是否被用户主动停止生成(与 error 区分:停止不是错误) */
  stopped?: boolean
}

/** 会话 */
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

/** 对话存储状态 */
export interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  isSending: boolean
}

/** 主题模式:跟随系统 / 强制浅色 / 强制深色 */
export type ThemeMode = 'system' | 'light' | 'dark'

/** 应用设置 */
export interface Settings {
  /** 主题模式 */
  theme: ThemeMode
  /** OpenAI 兼容 API 地址 */
  apiBaseUrl: string
  /** API Key */
  apiKey: string
  /** 模型名称 */
  model: string
  /** 系统提示词 */
  systemPrompt: string
  /** 温度 0~2 */
  temperature: number
  /** 自动朗读 AI 回复 */
  autoSpeak: boolean
}

/** 流式对话回调 */
export interface StreamCallbacks {
  onChunk: (delta: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
  /** 请求被中断(用户点击停止 / 空闲超时)时触发,与 onError 区分开 */
  onAbort?: () => void
}

/** 语音识别事件回调 */
export interface SpeechRecognitionCallbacks {
  onResult: (text: string) => void
  onError?: (error: Error) => void
  onEnd?: () => void
  onStart?: () => void
}

/**
 * 语音识别的「门面句柄」。
 *
 * ★ 注意它不是浏览器的原生 SpeechRecognition:
 *   原生对象有 lang / continuous / onresult 等一大堆属性和会抛异常的 start(),
 *   这里只暴露三个方法,而且内部自己管好了状态 ——
 *   重复 start 会被静默忽略、失败会回滚,调用方不用操心。
 */
export interface SpeechRecognizerHandle {
  start: () => void
  stop: () => void
  abort: () => void
}
