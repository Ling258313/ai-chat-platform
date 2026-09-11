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

/** 应用设置 */
export interface Settings {
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
