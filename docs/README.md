# 📚 项目文档总览

> **AI 对话平台** —— 基于 Vue 3 + Vite + Pinia + Vue Router + TypeScript 的 AI 对话应用,配有一层 **Node.js + Express BFF**(见 `server/`)持有密钥并做 SSE 流式透传,集成 Web Speech API 语音识别/合成,支持对接 OpenAI 兼容 API(OpenAI、DeepSeek、Moonshot、Ollama 等)。

本目录是项目的完整文档体系,按主题拆分,方便按需查阅。

## 📖 文档目录

| 文档 | 内容 | 适用读者 |
|------|------|----------|
| [快速开始](getting-started.md) | 环境要求、安装、配置、启动、构建 | 新成员 / 使用者 |
| [项目结构](project-structure.md) | 目录树、各文件职责说明 | 新成员 / 开发者 |
| [架构设计](architecture.md) | 总体架构、数据流、状态与服务层设计 | 开发者 |
| [环境变量与设置](configuration.md) | 环境变量、设置项、配置优先级 | 使用者 / 开发者 |
| [AI 服务对接](ai-integration.md) | OpenAI 兼容 API 调用、SSE 流式解析、Node BFF 代理 | 开发者 |
| [语音功能](speech.md) | 语音识别(STT)、语音合成(TTS)、浏览器兼容性 | 使用者 / 开发者 |
| [数据持久化](data-persistence.md) | localStorage 存储结构、持久化机制、安全说明 | 开发者 |
| [modlens 视觉技能](modlens/README.md) | 已安装的 modlens 插件:官方文档副本、安装状态、配置与排障 | 开发者 |

## 🧭 建议阅读顺序

1. **使用项目**:先看 [快速开始](getting-started.md)
2. **了解代码结构**:看 [项目结构](project-structure.md) 与 [架构设计](architecture.md)
3. **深入某模块**:按需查阅 [AI 服务对接](ai-integration.md)、[语音功能](speech.md)、[数据持久化](data-persistence.md)
4. **调整配置**:看 [环境变量与设置](configuration.md)

## 📌 快速速览

- **技术栈**:Vue 3.5(`<script setup>` 组合式 API)、Vite 8、Pinia 3、Vue Router 4、TypeScript 5.9(strict)
- **核心能力**:SSE 流式对话、多会话管理、Web Speech 语音输入/朗读、明暗主题、移动端适配
- **数据存储**:会话与设置持久化在浏览器 `localStorage`;服务端 `server/` 为无状态 BFF,不落库
- **Node 版本要求**:`^22.18.0 || >=24.12.0`

> 💡 顶部 `README.md` 为项目入口说明,本文档目录与之一致,细节以各分篇为准。
