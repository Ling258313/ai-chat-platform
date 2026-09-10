# 🎤 语音功能

本文说明项目的语音识别(STT)与语音合成(TTS)实现、浏览器兼容性与已知问题。

## 一、技术基础

语音功能基于浏览器原生 **Web Speech API**,无需额外依赖:

- **语音识别(STT)**:`SpeechRecognition` / `webkitSpeechRecognition`
- **语音合成(TTS)**:`speechSynthesis` + `SpeechSynthesisUtterance`

封装位于 `src/services/speech.ts`,组件层组合函数位于 `src/composables/useSpeech.ts`。

## 二、语音识别(STT)

### 入口与交互

- 对话输入框左侧的 🎤 按钮(组件 `ChatInput.vue`)
- 点击开始聆听,再次点击停止;识别结果实时填入输入框,可编辑后发送
- 识别期间按钮显示脉冲动画

### 识别配置(`createSpeechRecognizer`)

| 参数 | 值 | 说明 |
|------|-----|------|
| `lang` | `zh-CN` | 中文识别 |
| `continuous` | `true` | 连续识别 |
| `interimResults` | `true` | 返回中间结果,实现实时回填 |
| `maxAlternatives` | `1` | 单候选 |

### 能力检测

- `isSpeechRecognitionSupported()`:浏览器是否支持识别(不支持时隐藏/禁用 🎤 按钮)
- `isSpeechSynthesisSupported()`:浏览器是否支持合成

### 错误码映射

服务层将底层错误码转为用户友好提示:

| 错误码 | 提示 |
|--------|------|
| `not-allowed` | 麦克风权限被拒绝,提示在地址栏开启权限 |
| `service-not-allowed` | 语音服务不可用,检查权限或使用 HTTPS |
| `network` | 依赖 Google 服务,国内网络建议改用 Edge |
| `audio-capture` | 麦克风被占用 |
| `language-not-supported` | 浏览器不支持中文识别 |
| `aborted` | 识别已中断 |
| `no-speech` | 静默忽略 |

### 使用前提

- 浏览器:Chrome / Edge / Safari;**Firefox 不支持识别**
- 环境:`localhost` 或 **HTTPS**(`ChatInput.vue` 中显式校验)
- 必须由用户手势触发 `start()`;识别期间需保持页面焦点

## 三、语音合成(TTS)

### 手动朗读

- AI 消息气泡旁提供 🔊 朗读按钮(组件 `MessageItem.vue`)
- 点击朗读、再点停止;`useSpeechSynthesis` 组合函数封装了 `isSpeaking` 状态
- 朗读时长按文本长度估算(`max(2000, 文本长度 × 300)ms`)控制按钮状态

### 自动朗读

- 设置页勾选「自动朗读 AI 的回复」(`autoSpeak`)
- 注意:当前实现中自动朗读由设置项保存,朗读触发逻辑可在此基础上扩展(见下方说明)

### 语音合成配置

```ts
const utterance = new SpeechSynthesisUtterance(text)
utterance.lang = 'zh-CN'
utterance.rate = 1
utterance.pitch = 1
window.speechSynthesis.speak(utterance)
```

> 组件卸载时(`onUnmounted`)会自动 `cancel()` 停止朗读,避免残留播放。

## 四、浏览器兼容性

| 功能 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| 语音识别(STT) | ✅ | ✅ | ❌ | ✅ |
| 语音合成(TTS) | ✅ | ✅ | ✅ | ✅ |
| SSE 流式对话 | ✅ | ✅ | ✅ | ✅ |

- Firefox 不支持识别但支持合成,界面会禁用 🎤 按钮并给出提示
- Safari 的语音识别需 iOS 16+ 且 HTTPS

## 五、已知问题与注意事项

1. **Chrome 识别依赖 Google 服务**:国内网络下 `network` 错误高发,代码会弹出更醒目的提示,建议改用 Edge
2. **必须 HTTPS**:部署到线上时务必使用 HTTPS,否则语音按钮会拒绝启动
3. **权限**:首次点击 🎤 需允许麦克风权限,拒绝后需在地址栏手动开启
4. **识别状态**:连续识别模式下需手动停止;组件卸载时会 `abort()` 清理

## 六、扩展指引

- 识别语言:修改 `createSpeechRecognizer` 中的 `recognition.lang`
- 自动朗读接入:在 `chat.ts` 的 `onChunk`/`onDone` 中根据 `settings.autoSpeak` 调用 `speak()` 即可
- 更精确的朗读状态:监听 `utterance.onend` 事件替代文本长度估算

关联文档:[架构设计](architecture.md) · [项目结构](project-structure.md)
