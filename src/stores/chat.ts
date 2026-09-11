import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ChatState, Conversation, Message } from '@/types'
import { streamChat } from '@/services/api'
import { useSettingsStore } from '@/stores/settings'

const STORAGE_KEY = 'ai-chat-conversations'

/** 流式请求空闲超时(毫秒):这么久没有任何新分片就中断,避免永久卡在"正在输入" */
const IDLE_TIMEOUT_MS = 30_000

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Conversation[]
    }
  } catch {
    // 忽略解析错误
  }
  return []
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>(loadConversations())
  const activeConversationId = ref<string | null>(null)
  const isSending = ref(false)

  /** 当前流式请求的中断控制器 */
  let abortController: AbortController | null = null
  /** 空闲超时定时器 */
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  /** 本次中断是否由超时引起(用于给不同的提示文案) */
  let abortedByTimeout = false

  function clearIdleTimer() {
    if (idleTimer !== null) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  /**
   * 重置空闲计时。每收到一个分片就重置,
   * 所以只有"长时间完全没有新内容"才算超时,持续输出的长回复不会被误杀。
   */
  function armIdleTimer() {
    clearIdleTimer()
    idleTimer = setTimeout(() => {
      abortedByTimeout = true
      abortController?.abort()
    }, IDLE_TIMEOUT_MS)
  }

  /** 用户主动停止生成(保留已收到的内容) */
  function stopGeneration() {
    if (!abortController) return
    abortedByTimeout = false
    abortController.abort()
  }

  // 持久化
  watch(
    conversations,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    },
    { deep: true },
  )

  /** 当前会话 */
  const activeConversation = computed(
    () => conversations.value.find((c) => c.id === activeConversationId.value) ?? null,
  )

  /** 当前会话的消息 */
  const messages = computed(() => activeConversation.value?.messages ?? [])

  /** 是否有会话 */
  const hasConversations = computed(() => conversations.value.length > 0)

  function createConversation(): string {
    const id = generateId()
    const conversation: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
    }
    conversations.value.unshift(conversation)
    activeConversationId.value = id
    return id
  }

  function selectConversation(id: string) {
    activeConversationId.value = id
  }

  function deleteConversation(id: string) {
    const idx = conversations.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    conversations.value.splice(idx, 1)
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null
    }
  }

  function clearConversations() {
    conversations.value = []
    activeConversationId.value = null
  }

  /** 向指定会话追加消息(内部使用,不依赖 activeConversationId) */
  function addMessageTo(conv: Conversation, role: Message['role'], content: string): Message {
    const message: Message = {
      id: generateId(),
      role,
      content,
      createdAt: Date.now(),
    }
    conv.messages.push(message)

    // 更新会话标题(取第一条用户消息)
    if (role === 'user' && conv.title === '新对话') {
      conv.title = content.slice(0, 20) || '新对话'
    }
    return message
  }

  function addMessage(role: Message['role'], content: string): Message {
    const conv = activeConversation.value
    if (!conv) throw new Error('没有活跃会话')
    return addMessageTo(conv, role, content)
  }

  function findConversation(id: string): Conversation | undefined {
    return conversations.value.find((c) => c.id === id)
  }

  /**
   * 更新某条消息
   * @param conversationId 目标会话 id。
   *   流式回调必须传:用户在流式输出期间可能切换会话,
   *   若仍用 activeConversation 定位,分片会被写到别的会话、甚至静默丢弃。
   */
  function updateMessage(id: string, patch: Partial<Message>, conversationId?: string) {
    const conv = conversationId ? findConversation(conversationId) : activeConversation.value
    if (!conv) return
    const msg = conv.messages.find((m) => m.id === id)
    if (msg) {
      Object.assign(msg, patch)
    }
  }

  /**
   * 发送消息并获取 AI 回复(流式)
   */
  async function sendMessage(text: string): Promise<void> {
    const content = text.trim()
    if (!content || isSending.value) return

    // 确保有活跃会话
    if (!activeConversation.value) {
      createConversation()
    }

    // 锁定本次请求的目标会话:流式回调期间用户可以切走,
    // 后续所有写入都以这里捕获的会话为准,而不是当时的 activeConversation。
    const conv = activeConversation.value
    if (!conv) return
    const conversationId = conv.id

    // 添加用户消息
    const userMsg = addMessageTo(conv, 'user', content)

    // 创建占位的 AI 消息
    const assistantMsg = addMessageTo(conv, 'assistant', '')
    assistantMsg.isStreaming = true

    isSending.value = true

    // 建立本次请求的中断控制:"停止生成"和空闲超时都通过它中断
    abortController = new AbortController()
    abortedByTimeout = false
    armIdleTimer()

    const settings = useSettingsStore().settings

    try {
      // 准备消息历史(含系统提示词)
      const history: Message[] = []
      if (settings.systemPrompt.trim()) {
        history.push({
          id: generateId(),
          role: 'system',
          content: settings.systemPrompt.trim(),
          createdAt: Date.now(),
        })
      }
      // 取本次请求所属会话的所有消息(去掉正在流式的空占位消息)
      for (const m of conv.messages) {
        if (m.id === assistantMsg.id && m.content === '') continue
        if (m.id === userMsg.id || m.content.trim() !== '') {
          history.push(m)
        }
      }

      await streamChat({
        apiBaseUrl: settings.apiBaseUrl,
        apiKey: settings.apiKey,
        model: settings.model || 'deepseek-v4-flash',
        messages: history,
        temperature: settings.temperature,
        signal: abortController.signal,
        callbacks: {
          onChunk: (delta) => {
            // 有内容到达就重置空闲计时
            armIdleTimer()
            updateMessage(
              assistantMsg.id,
              { content: assistantMsg.content + delta },
              conversationId,
            )
          },
          onDone: () => {
            updateMessage(assistantMsg.id, { isStreaming: false }, conversationId)
          },
          onError: (error) => {
            updateMessage(
              assistantMsg.id,
              { isStreaming: false, error: error.message },
              conversationId,
            )
          },
          onAbort: () => {
            if (abortedByTimeout) {
              updateMessage(
                assistantMsg.id,
                {
                  isStreaming: false,
                  error: `等待响应超时,已中断(${IDLE_TIMEOUT_MS / 1000} 秒内没有新内容)`,
                },
                conversationId,
              )
            } else {
              // 主动停止:保留已收到的部分内容,标记为已停止(不是错误)
              updateMessage(
                assistantMsg.id,
                { isStreaming: false, stopped: true },
                conversationId,
              )
            }
          },
        },
      })
    } catch (error) {
      updateMessage(
        assistantMsg.id,
        {
          isStreaming: false,
          error: error instanceof Error ? error.message : '发送失败',
        },
        conversationId,
      )
    } finally {
      clearIdleTimer()
      abortController = null
      isSending.value = false
    }
  }

  function resetStore(): ChatState {
    conversations.value = []
    activeConversationId.value = null
    isSending.value = false
    localStorage.removeItem(STORAGE_KEY)
    return { conversations: [], activeConversationId: null, isSending: false }
  }

  return {
    conversations,
    activeConversationId,
    isSending,
    activeConversation,
    messages,
    hasConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    clearConversations,
    addMessage,
    updateMessage,
    sendMessage,
    stopGeneration,
    resetStore,
  }
})
