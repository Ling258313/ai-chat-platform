import type { Message, StreamCallbacks } from '@/types'

/**
 * OpenAI 兼容 Chat Completions API 客户端
 * 支持流式输出(SSE)
 */

interface ChatCompletionRequest {
  model: string
  messages: Array<{ role: Message['role']; content: string }>
  stream: boolean
  temperature: number
}

interface SSEChunk {
  choices?: Array<{
    delta?: { content?: string }
    finish_reason?: string | null
  }>
}

/**
 * 发送流式对话请求
 * @param apiBaseUrl API 地址,如 https://api.openai.com/v1
 * @param apiKey API Key
 * @param model 模型名称
 * @param messages 消息历史
 * @param temperature 温度
 * @param callbacks 流式回调
 */
export async function streamChat(
  apiBaseUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  temperature: number,
  callbacks: StreamCallbacks,
): Promise<void> {
  // 去掉流式标记,只保留用户/助手消息(排除 system 内部消息)
  const chatMessages = messages
    .filter((m) => m.role !== 'system' || m.content.trim() !== '')
    .map((m) => ({ role: m.role, content: m.content }))

  const body: ChatCompletionRequest = {
    model,
    messages: chatMessages,
    stream: true,
    temperature,
  }

  // 构建请求 URL
  let url = ''
  if (apiBaseUrl) {
    // 用户配置了完整地址,直接请求
    url = `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`
  } else {
    // 未配置地址,走 Vite 代理
    url = '/api/chat'
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    const error = err instanceof Error ? err : new Error('网络请求失败')
    callbacks.onError?.(new Error(`网络错误:${error.message}`))
    return
  }

  if (!response.ok) {
    let detail = ''
    try {
      const data = await response.json()
      detail = data?.error?.message ?? JSON.stringify(data)
    } catch {
      detail = await response.text().catch(() => '')
    }
    callbacks.onError?.(new Error(`API 错误 (${response.status}):${detail}`))
    return
  }

  if (!response.body) {
    callbacks.onError?.(new Error('浏览器不支持流式响应'))
    return
  }

  // 解析 SSE 流
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按行解析 SSE 数据
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // 保留未完成的行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') {
          callbacks.onDone?.()
          return
        }

        try {
          const chunk = JSON.parse(data) as SSEChunk
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            callbacks.onChunk(delta)
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }

    // 处理剩余的 buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim()
        if (data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data) as SSEChunk
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) {
              callbacks.onChunk(delta)
            }
          } catch {
            // 忽略
          }
        }
      }
    }

    callbacks.onDone?.()
  } catch (err) {
    const error = err instanceof Error ? err : new Error('流式读取失败')
    callbacks.onError?.(error)
  } finally {
    reader.releaseLock()
  }
}
