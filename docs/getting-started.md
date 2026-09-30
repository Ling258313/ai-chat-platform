# 🚀 快速开始

本文介绍如何在本机安装、配置并运行 **AI 对话平台**。

## 1. 环境要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | `^22.18.0` 或 `>=24.12.0`(见 `package.json` engines) |
| npm | 随 Node.js 安装即可 |

> 语音识别(STT)功能需要 **Chrome / Edge / Safari** 浏览器,且仅在 `localhost` 或 **HTTPS** 环境下可用。

## 2. 安装依赖

```bash
npm install                        # 前端
cd server && npm install && cd ..  # Node BFF
```

## 3. 配置密钥(只配服务端,前端不需要)

**前端不需要任何 API 配置**——Key 只存在于服务端的 `.env` 里:

```bash
cd server
cp .env.example .env
```

```bash
# server/.env
PORT=3000
UPSTREAM_BASE_URL=https://api.deepseek.com/v1
UPSTREAM_API_KEY=sk-xxxxxxxx    # 只在这里,不进浏览器、不进构建产物
DEFAULT_MODEL=deepseek-chat
CORS_ORIGINS=http://localhost:5173
```

> ⚠️ 根目录的 `.env.example` 是**直连调试模式**用的,里面的变量以 `VITE_` 开头,
> Vite 会在构建时把它们**静态替换成字面量写进 `dist/*.js`**,不要在那里填真实 Key。
> 确需使用请复制为 `.env.development.local`(仅 dev 加载),**不要**复制为 `.env.local`。

各变量说明详见 [环境变量与设置](configuration.md);服务端配置见 [`../server/README.md`](../server/README.md)。

## 4. 启动(需要两个终端)

```bash
# 终端 1:Node BFF
cd server && npm run dev     # http://localhost:3000

# 终端 2:前端
npm run dev                  # http://localhost:5173
```

浏览器打开 <http://localhost:5173> 即可使用。

> Vite 已把 `/api` 代理到本地 Node BFF(见 `vite.config.ts`),由 BFF 携带密钥请求上游,
> 浏览器全程不接触密钥。详见 [AI 服务对接](ai-integration.md)。

## 5. 构建生产版本

```bash
npm run build     # 类型检查(vue-tsc)+ 构建,产物输出到 dist/
npm run preview   # 本地预览构建结果
```

## 6. 使用指引

- **对话**:左侧「新建对话」创建会话,底部输入框发送消息(Enter 发送、Shift+Enter 换行),支持点击 🎤 语音输入
- **设置**:右上角「⚙️ 设置」配置 API 地址、Key、模型、系统提示词、温度与朗读偏好
- **历史记录**:会话与消息自动保存在浏览器本地,刷新页面不丢失

## 7. 常见问题

| 问题 | 解决办法 |
|------|----------|
| 请求报跨域错误 | 在设置页填写完整的 API 地址(直接请求),或留空走 Vite 代理 |
| 语音识别按钮不可用 | 使用 Chrome / Edge / Safari,并在 localhost 或 HTTPS 下访问 |
| 国内 Chrome 语音识别失败 | Chrome 识别依赖 Google 服务,建议改用 Edge 浏览器 |
| 修改 API 配置不生效 | 检查设置页配置(优先于环境变量),确认后点击「保存设置」 |

更多细节见 [项目文档总览](README.md)。
