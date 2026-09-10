import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ChatState, Conversation, Message } from '@/types'
import { streamChat } from '@/services/api'
import { useSettingsStore } from '@/stores/settings'

const STORAGE_KEY = 'ai-chat-conversations'

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

  function addMessage(role: Message['role'], content: string): Message {
    const conv = activeConversation.value
    if (!conv) throw new Error('没有活跃会话')

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

  function updateMessage(id: string, patch: Partial<Message>) {
    const conv = activeConversation.value
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

    // 添加用户消息
    const userMsg = addMessage('user', content)

    // 创建占位的 AI 消息
    const assistantMsg = addMessage('assistant', '')
    assistantMsg.isStreaming = true

    isSending.value = true

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
      // 取当前会话所有消息(去掉正在流式的空消息)
      const conv = activeConversation.value
      if (conv) {
        for (const m of conv.messages) {
          if (m.id === assistantMsg.id && m.content === '') continue
          if (m.id === userMsg.id || m.content.trim() !== '') {
            history.push(m)
          }
        }
      }

      await streamChat(
        settings.apiBaseUrl,
        settings.apiKey,
        settings.model || 'deepseek-v4-flash',
        history,
        settings.temperature,
        {
          onChunk: (delta) => {
            updateMessage(assistantMsg.id, {
              content: assistantMsg.content + delta,
            })
          },
          onDone: () => {
            updateMessage(assistantMsg.id, { isStreaming: false })
          },
          onError: (error) => {
            updateMessage(assistantMsg.id, {
              isStreaming: false,
              error: error.message,
            })
          },
        },
      )
    } catch (error) {
      updateMessage(assistantMsg.id, {
        isStreaming: false,
        error: error instanceof Error ? error.message : '发送失败',
      })
    } finally {
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
    resetStore,
  }
})
