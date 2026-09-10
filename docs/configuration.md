# ⚙️ 环境变量与设置

本文说明项目环境变量、设置页配置项及二者的优先级关系。

## 一、环境变量

项目通过 Vite 的 `import.meta.env` 读取环境变量,类型声明位于 `src/vite-env.d.ts`,模板位于 `.env.example`。

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | OpenAI 兼容 API 地址(可留空走本地代理) | `https://api.deepseek.com` |
| `VITE_API_KEY` | API Key(可在设置页覆盖) | `sk-xxxxxxxx` |
| `VITE_MODEL` | 默认模型名称 | `deepseek-chat` |

支持的 API 服务示例:

```bash
# OpenAI
VITE_API_BASE_URL=https://api.openai.com/v1
VITE_MODEL=gpt-4o-mini

# DeepSeek
VITE_API_BASE_URL=https://api.deepseek.com
VITE_MODEL=deepseek-chat

# Moonshot(Kimi)
VITE_API_BASE_URL=https://api.moonshot.cn/v1
VITE_MODEL=moonshot-v1-8k

# Ollama(本地)
VITE_API_BASE_URL=http://localhost:11434/v1
VITE_MODEL=qwen2.5
```

> ⚠️ 环境变量在 **构建时** 被静态替换,修改 `.env.local` 后需重启 `npm run dev` 或重新 `npm run build` 才生效。

## 二、设置项(设置页)

设置页(`/settings`)中可配置以下字段,全部保存在浏览器 `localStorage`:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| API 地址 `apiBaseUrl` | string | 环境变量 `VITE_API_BASE_URL`(默认空) | 留空则使用 Vite 代理 `/api/chat` |
| API Key `apiKey` | string | 环境变量 `VITE_API_KEY`(默认空) | 明文保存在 localStorage |
| 模型名称 `model` | string | 环境变量 `VITE_MODEL`(默认 `deepseek-v4-flash`) | 如 `gpt-4o-mini`、`deepseek-chat` |
| 系统提示词 `systemPrompt` | string | 内置默认文案 | 定义 AI 的角色与行为 |
| 温度 `temperature` | number | `0.7` | 范围 0~2,越低越确定 |
| 自动朗读 `autoSpeak` | boolean | `false` | 是否自动朗读 AI 回复 |

## 三、配置优先级

设置值的解析顺序(见 `src/stores/settings.ts` 的 `DEFAULT_SETTINGS` 与 `loadSettings`):

```
1. localStorage 中用户显式保存的设置(最高)
        ↓ 覆盖
2. 环境变量默认值(VITE_API_BASE_URL / VITE_API_KEY / VITE_MODEL)
        ↓ 覆盖
3. 代码内置默认值(如 temperature=0.7, systemPrompt 默认文案)
```

即:**用户设置优先于环境变量,环境变量优先于内置默认值**。

> 注:系统提示词与温度没有对应的环境变量,始终使用内置默认值。

## 四、存储与清除

- 设置保存在 `localStorage` 键 `ai-chat-settings`(JSON 格式)
- 点击设置页「恢复默认」会调用 `settingsStore.resetSettings()`,恢复为默认值(即回到环境变量/内置默认)
- 手动清除:`localStorage.removeItem('ai-chat-settings')` 或在浏览器开发者工具中删除

## 五、安全提示

- API Key 以 **明文** 形式存储在浏览器 localStorage,仅适合个人本地使用
- 请不要在共享电脑上勾选「记住」类配置,也不要把 `.env.local` 提交到版本库

关联文档:[快速开始](getting-started.md) · [数据持久化](data-persistence.md) · [AI 服务对接](ai-integration.md)
