# 🤖 AI 对话平台

基于 **Vue 3 + Vite + Pinia + Vue Router + TypeScript** 的 AI 对话平台,集成了 **Web Speech API** 实现语音识别(STT),支持对接 **OpenAI 兼容 API**。

## ✨ 功能特性

- 💬 **AI 对话**:支持流式输出(SSE),实时展示 AI 回复
- 🎤 **语音识别(STT)**:使用 Web Speech API,支持按住说话,自动将语音转文字
- 🔊 **语音合成(TTS)**(可选):将 AI 回复朗读出来
- 🗂️ **多会话管理**:创建、切换、删除多个对话会话
- ⚙️ **灵活配置**:可在设置页配置 API 地址、Key、模型,支持自定义系统提示词
- 📱 **响应式布局**:适配桌面和移动端

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 前端框架(组合式 API + `<script setup>`) |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [Pinia](https://pinia.vuejs.org/) | 状态管理 |
| [Vue Router](https://router.vuejs.org/) | 路由管理 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | 语音识别与合成 |
| [OpenAI 兼容 API](https://platform.openai.com/docs/api-reference) | AI 对话能力(兼容 DeepSeek、Moonshot、Ollama 等) |

## 📁 项目结构

```
vue-project/
├── index.html                # HTML 入口
├── package.json
├── tsconfig.json             # TS 配置(引用 app/node 子配置)
├── vite.config.ts            # Vite 配置(含 API 代理)
├── docs/                     # 项目文档(详见下方"项目文档")
├── src/
│   ├── main.ts               # 应用入口
│   ├── App.vue               # 根组件
│   ├── vite-env.d.ts         # 环境类型声明
│   ├── router/
│   │   └── index.ts          # 路由配置
│   ├── stores/
│   │   ├── chat.ts           # 对话状态(消息、会话、发送逻辑)
│   │   └── settings.ts       # 设置状态(API、语音偏好)
│   ├── services/
│   │   ├── api.ts            # OpenAI 兼容 API 客户端(SSE 流式)
│   │   └── speech.ts         # Web Speech 语音识别/合成封装
│   ├── types/
│   │   └── index.ts          # 类型定义
│   ├── composables/
│   │   └── useSpeech.ts      # 语音合成组合式函数
│   ├── views/
│   │   ├── ChatView.vue      # 对话页面
│   │   └── SettingsView.vue  # 设置页面
│   └── components/
│       ├── ChatWindow.vue    # 消息列表
│       ├── ChatInput.vue     # 输入区(含语音按钮)
│       ├── MessageItem.vue   # 单条消息
│       ├── ConversationList.vue  # 会话列表
│       └── AppHeader.vue     # 顶部导航
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`,填入你的 API 信息:

```bash
# OpenAI 兼容 API 地址
VITE_API_BASE_URL=https://api.openai.com/v1
# API Key(可在设置页覆盖)
VITE_API_KEY=sk-xxxxxxxx
# 默认模型
VITE_MODEL=gpt-4o-mini
```

> **支持的服务**:OpenAI、DeepSeek、Moonshot(Kimi)、通义千问、Ollama 本地等所有兼容 OpenAI Chat Completions 接口的服务。

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`

### 4. 构建生产版本

```bash
npm run build
npm run preview   # 预览构建结果
```

## 🎤 语音功能说明

### 语音识别(STT)

- 使用浏览器内置的 `webkitSpeechRecognition` / `SpeechRecognition`
- **支持浏览器**:Chrome、Edge、Safari(需 HTTPS 或 localhost)
- 点击输入框旁的 🎤 按钮开始/停止语音识别
- 识别结果会自动填入输入框,可继续编辑后发送

### 语音合成(TTS)

- 使用 `speechSynthesis` API
- 在设置页开启"朗读 AI 回复",AI 回复后会自动朗读
- 也可点击消息旁的 🔊 按钮手动朗读

> ⚠️ 注意:Web Speech API 是浏览器原生 API,需要 **HTTPS** 环境(本地 localhost 除外)。部署到线上时请使用 HTTPS。

## ⚙️ 设置说明

在设置页可配置:

- **API 地址**:OpenAI 兼容的接口地址
- **API Key**:你的密钥(仅保存在浏览器 localStorage)
- **模型名称**:如 `gpt-4o-mini`、`deepseek-chat`、`moonshot-v1-8k` 等
- **系统提示词**:自定义 AI 的角色和行为
- **温度**:控制回答的随机性(0~2)
- **朗读回复**:是否自动朗读 AI 的回复

## 🌐 跨域代理

`vite.config.ts` 中已配置代理,把 `/api/chat` 转发到 OpenAI 兼容地址:

```ts
'/api/chat': {
  target: 'https://api.openai.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/chat/, '/v1/chat/completions'),
}
```

如果你在设置页填了完整 API 地址(如 `https://api.openai.com/v1`),会**直接请求**该地址;若留空则使用 Vite 代理,避免浏览器跨域限制。

## 🧠 数据持久化

- 会话与消息保存在浏览器 `localStorage`
- API 配置保存在 `localStorage`(注意:Key 以明文存储,仅用于本地开发)
- 刷新页面后对话记录仍在

## 📚 项目文档

详细文档见 [`docs/`](docs/README.md) 目录:

| 文档 | 内容 |
|------|------|
| [📖 文档总览](docs/README.md) | 全部文档的索引与阅读顺序 |
| [🚀 快速开始](docs/getting-started.md) | 环境要求、安装、配置、运行、构建 |
| [📁 项目结构](docs/project-structure.md) | 目录树与各文件职责 |
| [🏗️ 架构设计](docs/architecture.md) | 总体架构、数据流、状态与服务层设计 |
| [⚙️ 环境变量与设置](docs/configuration.md) | 环境变量、设置项、配置优先级 |
| [🤖 AI 服务对接](docs/ai-integration.md) | OpenAI 兼容 API、SSE 流式、跨域代理 |
| [🎤 语音功能](docs/speech.md) | 语音识别(STT)、语音合成(TTS)、兼容性 |
| [💾 数据持久化](docs/data-persistence.md) | localStorage 存储结构与安全说明 |

## 📄 License

MIT
