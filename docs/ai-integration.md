# 🤖 AI 服务对接

本文说明项目如何对接 OpenAI 兼容 API,包括请求构建、SSE 流式解析与跨域处理。

## 一、协议概述

项目遵循 **OpenAI Chat Completions** 协议(即 `POST /v1/chat/completions`),因此可对接所有兼容该接口的服务:

- OpenAI(`gpt-4o-mini` 等)
- DeepSeek(`deepseek-chat`、`deepseek-reasoner`)
- Moonshot / Kimi(`moonshot-v1-8k`)
- 通义千问、智谱 GLM 等国内服务
- Ollama 本地模型(`http://localhost:11434/v1`)

## 二、请求构建

核心函数 `streamChat()` 位于 `src/services/api.ts`,签名:

```ts
streamChat(
  apiBaseUrl: string,   // API 地址(可空)
  apiKey: string,       // API Key(可空)
  model: string,        // 模型名称
  messages: Message[],  // 消息历史(含 system)
  temperature: number,  // 温度 0~2
  callbacks: { onChunk; onDone?; onError? },  // 流式回调
): Promise<void>
```

### 请求 URL 的两种模式

```ts
if (apiBaseUrl) {
  // 模式一:用户配置了完整地址 → 直接请求
  url = `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`
} else {
  // 模式二:未配置 → 走 Vite 代理,避免浏览器跨域
  url = '/api/chat'
}
```

> 注意:若在设置页填写 `https://api.openai.com/v1`,实际请求地址为 `https://api.openai.com/v1/chat/completions`(自动去除末尾 `/` 并拼接)。

### 请求头与请求体

```ts
headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,   // 未配置 Key 时不带
}

body = {
  model,
  messages: [{ role, content }, ...],  // system / user / assistant
  stream: true,
  temperature,
}
```

## 三、SSE 流式解析

服务端以 **SSE(Server-Sent Events)** 格式逐块返回,实现"打字机"效果:

```
data: {"choices":[{"delta":{"content":"你"},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":"好"},"finish_reason":null}]}

data: [DONE]
```

解析流程(`streamChat` 内部):

1. `fetch` 发起 POST,拿到 `response.body`(ReadableStream)
2. 用 `TextDecoder` + 行缓冲逐行读取,按 `\n` 切分,保留未完成的行
3. 过滤以 `data:` 开头的行,取 `data:` 后的 JSON
4. 遇到 `[DONE]` 立即调用 `onDone` 并结束
5. 正常行解析 `choices[0].delta.content` 作为增量,调用 `onChunk(delta)`
6. 流结束或读取异常时调用 `onDone` / `onError`,最后释放读锁

回调契约(见 `src/types/index.ts` 的 `StreamCallbacks`):

| 回调 | 触发时机 | 用途 |
|------|----------|------|
| `onChunk(delta)` | 收到每个内容增量 | 追加到 AI 消息,实时渲染 |
| `onDone()` | `[DONE]` 或流正常结束 | 关闭流式标记 |
| `onError(error)` | 网络/HTTP/解析错误 | 在消息气泡中展示错误 |

### 错误处理

- 网络异常:提示「网络错误:…」
- 非 2xx 响应:优先读取 `error.message` 字段,回退到原始响应文本
- 浏览器不支持流式响应:提示「浏览器不支持流式响应」
- 单行 JSON 解析失败:静默跳过,不影响整体流

## 四、发送流程(chat store)

`src/stores/chat.ts` 的 `sendMessage(text)` 完整流程:

1. 无活跃会话时自动创建会话
2. 追加用户消息;若会话标题为「新对话」,取用户消息前 20 字作为标题
3. 创建空的 AI 占位消息并标记 `isStreaming`
4. 组装消息历史:系统提示词(若配置)+ 当前会话全部消息(排除空流式消息)
5. 调用 `streamChat`,`onChunk` 增量追加内容,`onDone` 关闭流式标记
6. 失败时在消息上记录 `error` 字段展示错误气泡
7. `finally` 中复位 `isSending`,期间输入框与发送按钮禁用

## 五、Vite 开发代理

`vite.config.ts` 中配置了 `/api/chat` 代理:

```ts
'/api/chat': {
  target: 'https://api.openai.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/chat/, '/v1/chat/completions'),
}
```

- 开发时若设置页 **未填写** API 地址,请求 `/api/chat` 会被代理到 `https://api.openai.com/v1/chat/completions`
- 生产部署时不经过 Vite 代理,因此线上使用 **必须** 在设置页填写完整的 API 地址,或自行配置反向代理
- 修改目标服务(如改为 DeepSeek)时,直接改 `target` 与 `rewrite` 即可

## 六、扩展建议

- 需要自定义请求参数(如 `max_tokens`、`top_p`):在 `ChatCompletionRequest` 接口与 `streamChat` 请求体中扩展
- 需要支持多模态/图片:按目标服务协议在 `messages` 中扩展 `content` 结构
- 需要中断请求:可在 `streamChat` 中使用 `AbortController` 传入 fetch

关联文档:[架构设计](architecture.md) · [环境变量与设置](configuration.md)
