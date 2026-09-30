# 📁 项目结构

本项目的目录结构与各文件职责说明。

## 目录树

```
vue-project/
├── index.html                    # HTML 入口(挂载点 #app,加载 /src/main.ts)
├── package.json                  # 项目元信息、依赖与脚本
├── package-lock.json             # 依赖锁定文件
├── vite.config.ts                # Vite 配置(别名 @、端口、/api → 本地 Node BFF 代理)
├── tsconfig.json                 # TS 工程引用(聚合 app/node 两个子配置)
├── tsconfig.app.json             # 应用代码 TS 配置(strict,含 @/* 路径别名)
├── tsconfig.node.json            # 构建工具侧(Vite 配置)TS 配置
├── .env.example                  # 环境变量模板(提交到仓库)
├── .env.local                    # 直连调试模式的环境变量(已被 gitignore;不要放真实 Key)
├── .gitignore                    # Git 忽略规则
├── .vscode/
│   ├── extensions.json           # 推荐的 VSCode 扩展
│   └── settings.json             # 文件嵌套显示等编辑器设置
├── server/                       # Node.js + Express BFF(详见 server/README.md)
│   ├── src/
│   │   ├── index.js              # Express 应用装配:中间件顺序、SIGTERM 优雅关闭
│   │   ├── config.js             # 环境变量读取与校验(缺 Key 直接退出)
│   │   ├── routes/chat.js        # POST /api/chat:校验、SSE 透传、断开即 abort 上游
│   │   └── middleware/           # rateLimit.js 滑动窗口限流 / errorHandler.js 统一错误
│   ├── .env.example              # 服务端配置模板(UPSTREAM_API_KEY 等)
│   └── README.md                 # BFF 设计说明与已知边界
├── public/
│   └── favicon.ico               # 站点图标
├── dist/                         # 构建产物目录(不提交,由 npm run build 生成)
├── docs/                         # 项目文档(本文档目录)
│   ├── README.md                 # 文档总览
│   ├── getting-started.md        # 快速开始
│   ├── project-structure.md      # 项目结构(本文件)
│   ├── architecture.md           # 架构设计
│   ├── configuration.md          # 环境变量与设置
│   ├── ai-integration.md         # AI 服务对接
│   ├── speech.md                 # 语音功能
│   └── data-persistence.md       # 数据持久化
└── src/
    ├── main.ts                   # 应用入口:创建 Vue 实例,注册 Pinia 与 Router
    ├── App.vue                   # 根组件:侧边栏 + 顶栏 + 路由出口的布局骨架
    ├── vite-env.d.ts             # Vite 客户端类型与 ImportMetaEnv 环境变量声明
    ├── assets/
    │   └── main.css              # 全局样式:CSS 变量(主题色/暗色模式)、重置、工具类
    ├── router/
    │   └── index.ts              # 路由配置(/ 对话页、/settings 设置页、通配重定向)
    ├── stores/
    │   ├── chat.ts               # 对话状态:会话/消息管理、sendMessage 流式对话逻辑
    │   └── settings.ts           # 设置状态:API 与语音偏好,localStorage 持久化
    ├── services/
    │   ├── api.ts                # OpenAI 兼容 API 客户端:SSE 流式解析(streamChat)
    │   └── speech.ts             # Web Speech API 封装:语音识别/合成、能力检测
    ├── composables/
    │   └── useSpeech.ts          # useSpeechSynthesis 组合式函数(朗读与停止)
    ├── types/
    │   └── index.ts              # 全局类型:Message/Conversation/Settings/回调接口
    ├── views/
    │   ├── ChatView.vue          # 对话页:消息窗口 + 输入区,进入时自动建会话
    │   └── SettingsView.vue      # 设置页:AI 服务与语音偏好表单
    └── components/
        ├── AppHeader.vue         # 顶部导航:品牌、新建对话、页面切换
        ├── ConversationList.vue  # 侧边栏会话列表:新建/切换/删除
        ├── ChatWindow.vue        # 消息滚动区:空状态引导、自动滚底
        ├── ChatInput.vue         # 输入区:文本输入、语音按钮、发送
        └── MessageItem.vue       # 单条消息:气泡、流式光标、复制/朗读操作
```

## 分层职责

```
┌─────────────────────────────────────────────┐
│  Views(页面层)      ChatView / SettingsView  │
├─────────────────────────────────────────────┤
│  Components(组件层)  Header/List/Window/...  │
├─────────────────────────────────────────────┤
│  Stores(Pinia 状态层)  chat / settings       │
├─────────────────────────────────────────────┤
│  Services(服务层)     api / speech           │
│  Composables(组合函数) useSpeech             │
├─────────────────────────────────────────────┤
│  Types(类型层)        全局类型定义           │
└─────────────────────────────────────────────┘
```

调用方向自上而下:视图/组件 → Store → Service → 外部(LLM API / 浏览器语音 API)。类型定义被各层共享。

## 关键文件速查

| 文件 | 一句话说明 |
|------|-----------|
| `src/main.ts` | 装配 Vue 应用:Pinia + Router + 全局样式 |
| `src/router/index.ts` | 两条路由 + 通配重定向,路由切换时更新 `document.title` |
| `src/stores/chat.ts` | 会话/消息核心逻辑,`sendMessage()` 串联流式请求 |
| `src/stores/settings.ts` | 设置默认值来自环境变量,watch 深度持久化 |
| `src/services/api.ts` | `streamChat()` 发起 fetch + 手动解析 SSE |
| `src/services/speech.ts` | STT/TTS 封装与浏览器能力检测 |
| `src/assets/main.css` | 设计令牌(CSS 变量)集中在此,含 `prefers-color-scheme` 暗色模式 |

## 构建与脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器(端口 5173) |
| `npm run build` | `vue-tsc -b` 类型检查 + `vite build` 生产构建 |
| `npm run preview` | 预览构建产物 |

## 路径别名

`vite.config.ts` 与 `tsconfig.app.json` 均配置了 `@` → `./src` 别名,源码中统一使用 `@/xxx` 导入,例如:

```ts
import { useChatStore } from '@/stores/chat'
```
