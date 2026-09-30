# 💾 数据持久化

本文说明项目在浏览器端的本地数据存储:存储键、数据结构、持久化机制与安全注意事项。

## 一、存储总览

服务端 `server/` 是无状态 BFF,不落库;所有业务数据保存在浏览器 `localStorage`,共两个键:

| 存储键 | 内容 | 写入方 |
|--------|------|--------|
| `ai-chat-conversations` | 全部会话与消息 | `src/stores/chat.ts` |
| `ai-chat-settings` | 应用设置(API 配置、语音偏好) | `src/stores/settings.ts` |

## 二、会话与消息(`ai-chat-conversations`)

### 数据结构

```jsonc
// Conversation[]
[
  {
    "id": "lxxxxx-abc123",          // 会话 ID(generateId 生成)
    "title": "新对话",              // 会话标题(首条用户消息前 20 字,自动更新)
    "createdAt": 1730000000000,     // 创建时间戳(ms)
    "messages": [
      {
        "id": "lxxxxx-def456",      // 消息 ID
        "role": "user",             // user | assistant | system
        "content": "你好",          // 消息内容
        "createdAt": 1730000000000, // 时间戳(ms)
        "isStreaming": false,       // 可选:是否正在流式输出
        "error": "API 错误 (401)…"  // 可选:错误信息
      }
    ]
  }
]
```

### 持久化机制

- 使用 Pinia + `watch(conversations, ..., { deep: true })` 深度监听,任何会话/消息变更自动写入 localStorage
- 初始加载时 `loadConversations()` 读取并 `JSON.parse`,解析失败时回退为空数组

### 相关操作(chat store)

| 方法 | 说明 |
|------|------|
| `createConversation()` | 新建会话并设为活跃 |
| `selectConversation(id)` | 切换活跃会话 |
| `deleteConversation(id)` | 删除会话(活跃会话被删时切换到第一个) |
| `clearConversations()` | 清空全部会话 |
| `resetStore()` | 清空会话并移除存储键 |

## 三、设置(`ai-chat-settings`)

### 数据结构

```jsonc
// Settings(与 types/index.ts 一致)
{
  "apiBaseUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxxxxxxx",
  "model": "deepseek-chat",
  "systemPrompt": "你是一个乐于助人的 AI 助手…",
  "temperature": 0.7,
  "autoSpeak": false
}
```

### 持久化机制

- 同样通过 `watch(settings, ..., { deep: true })` 自动持久化
- 加载时与默认值合并(`{ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }`),保证新增字段有默认值

### 相关操作(settings store)

| 方法 | 说明 |
|------|------|
| `updateSettings(patch)` | 局部更新设置(设置页表单直接双向绑定 settings) |
| `resetSettings()` | 恢复为默认值(环境变量/内置默认) |

## 四、清除数据

```js
// 开发者工具 Console 中手动清除
localStorage.removeItem('ai-chat-conversations')
localStorage.removeItem('ai-chat-settings')

// 或清空全部
localStorage.clear()
```

界面侧:设置页「恢复默认」只重置设置;会话清空目前无界面入口(可调用 store 的 `clearConversations`)。

## 五、安全注意事项

> ⚠️ **只有在「直连调试模式」下 API Key 才会以明文存进** `ai-chat-settings`;
> 默认的 BFF 链路(设置页 API 地址留空)不会把密钥写进浏览器。

- 默认链路下请求经 Node BFF 转发,密钥只存在于服务端 `server/.env`,构建产物里也不会内联
- 直连调试模式仅适合个人本地使用;共享电脑/公共设备上请谨慎
- localStorage 中的数据任何同源脚本均可读取,勿存放敏感凭据
- 不要把含真实 Key 的文件提交到仓库(`server/.env`、`.env.local` 均已被 `.gitignore` 忽略)

## 六、扩展指引

- 数据量大时(数千条消息)localStorage(约 5MB 配额)可能不足,可考虑迁移到 IndexedDB 或后端存储
- 如需导入/导出对话,可将 `ai-chat-conversations` 的值导出为 JSON 文件
- 如需加密 Key,可结合 Web Crypto API 加解密后再存储(注意密钥本身的存储问题)

关联文档:[环境变量与设置](configuration.md) · [架构设计](architecture.md)
