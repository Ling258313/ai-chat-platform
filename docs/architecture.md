# 架构设计文档

> 本文为系统架构总览。配套文档:[项目结构](project-structure.md) · [AI 服务对接](ai-integration.md) · [语音功能](speech.md) · [数据持久化](data-persistence.md) · [文档总览](README.md)

## 总体架构

```
┌─────────────────────────────────────────────────────┐
│                    浏览器 (Vue 3 SPA)                │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  View    │  │  Pinia   │  │  Web Speech API   │  │
│  │ 组件层    │→ │  Store   │→ │  (STT / TTS)      │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│       │              │               │              │
│       │              ▼               │              │
│       │        ┌──────────┐          │              │
│       │        │ Service  │          │              │
│       │        │  api.ts  │          │              │
│       │        └──────────┘          │              │
│       │              │               │              │
└───────┼──────────────┼───────────────┼──────────────┘
        │              │               │
        │  fetch/SSE   │               │  浏览器原生语音
        ▼              ▼               ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│  Vite Dev    │  │ OpenAI 兼容 API │  │ 系统语音引擎  │
│  Server      │→ │ (OpenAI/Deep-  │  │ (OS 级)      │
│  (代理)      │  │  Seek/Ollama)  │  └──────────────┘
└──────────────┘  └────────────────┘
```

> 上图中 Vite Dev Server 的 `/api` 代理实际指向本地 **Node BFF(Express)**,
> 由 BFF 携带密钥请求上游「OpenAI 兼容 API」;浏览器与 BFF 之间不传递任何密钥。
> 设置页填写了 API 地址的「直连调试模式」会绕过 BFF,此时密钥存在浏览器 localStorage 中。

## 数据流

### 文本对话流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant V as ChatInput
    participant S as chat Store
    participant A as api.ts
    participant LLM as AI 服务

    U->>V: 输入消息 / 语音转文字
    V->>S: sendMessage(text)
    S->>S: 添加用户消息到当前会话
    S->>A: streamChat(messages, options)
    A->>LLM: POST /v1/chat/completions (stream: true)
    LLM-->>A: SSE 数据流
    A-->>S: 流式回调 onChunk(delta)
    S->>S: 追加到 AI 消息内容
    S-->>V: 实时渲染
```

### 语音识别流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant V as ChatInput
    participant S as speech service
    participant SR as SpeechRecognition

    U->>V: 按住/点击 🎤 按钮
    V->>S: start()
    S->>SR: recognition.start()
    SR-->>S: onresult(识别文本)
    S-->>V: 填入输入框
    U->>V: 点击发送
```

## 状态管理设计 (Pinia)

### chat store

```ts
interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  isStreaming?: boolean   // 是否正在流式输出
  error?: string          // 错误信息
}
```

### settings store

```ts
interface Settings {
  apiBaseUrl: string   // API 地址
  apiKey: string       // API Key
  model: string        // 模型名称
  systemPrompt: string // 系统提示词
  temperature: number  // 温度
  autoSpeak: boolean   // 自动朗读
}
```

## 服务层设计

### `services/api.ts`

- `streamChat()`:通过 fetch + ReadableStream 解析 SSE,支持流式输出
- 支持自定义 `onChunk` / `onDone` / `onError` 回调
- 完整消息历史传给 LLM

### `services/speech.ts`

- `createSpeechRecognizer()`:创建语音识别实例,封装 Web Speech API
- `speak(text)`:语音合成
- `isSpeechSupported()`:检测浏览器是否支持

## 关键设计决策

1. **流式输出**:使用 SSE 解析,让 AI 回复"打字机"效果实时显示
2. **本地持久化**:会话数据存 localStorage,刷新不丢失
3. **密钥不下发**:默认走 Node BFF(Vite 把 `/api` 代理到本地 Express 服务),API Key 只在服务端环境变量中,
   浏览器与构建产物均不接触;仅「直连调试模式」下才由浏览器直接请求上游。
   详见 [AI 服务对接](ai-integration.md) 与 [`../server/README.md`](../server/README.md)
4. **语音降级**:浏览器不支持 Web Speech API 时,隐藏语音按钮并提示
5. **TypeScript**:全链路类型安全,配置、消息、会话均有类型定义

## 浏览器兼容性

| 功能 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| Web Speech 识别 | ✅ | ✅ | ❌ | ✅ |
| Web Speech 合成 | ✅ | ✅ | ✅ | ✅ |
| SSE 流式 | ✅ | ✅ | ✅ | ✅ |

> Firefox 不支持语音识别,但支持语音合成。
