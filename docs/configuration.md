# ⚙️ 环境变量与设置

本文说明项目环境变量、设置页配置项及二者的优先级关系。

## 一、环境变量

项目通过 Vite 的 `import.meta.env` 读取环境变量,类型声明位于 `src/vite-env.d.ts`,模板位于 `.env.example`。

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | OpenAI 兼容 API 地址(**仅直连调试模式**;留空则走本地 BFF,推荐) | `https://api.deepseek.com` |
| `VITE_API_KEY` | ⚠️ **仅直连调试模式需要**;以 `VITE_` 开头的变量会被内联进 `dist/*.js`,不要填真实 Key | `sk-xxxxxxxx` |
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

> ⚠️ 环境变量在 **构建时** 被静态替换,修改 `.env.development.local` 后需重启 `npm run dev` 才生效。
> 走 BFF 链路(推荐)时以上变量全部留空即可,密钥配置见 `server/.env.example`。

## 二、设置项(设置页)

设置页(`/settings`)中可配置以下字段,全部保存在浏览器 `localStorage`:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| API 地址 `apiBaseUrl` | string | 环境变量 `VITE_API_BASE_URL`(默认空) | **留空则走本地 Node BFF**(Vite 把 `/api` 代理到 `localhost:3000`),推荐 |
| API Key `apiKey` | string | 环境变量 `VITE_API_KEY`(默认空) | **留空即可**:密钥由 BFF 在服务端持有。仅直连调试模式下填了才会明文存进 localStorage |
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

- 走 BFF 链路(推荐)时,**API Key 只存在于服务端 `.env`**,浏览器全程不接触,构建产物里也不会内联
- 仅在设置页填写了 API 地址的 **直连调试模式** 下,Key 才会以明文存进 localStorage,请勿在共享电脑上使用
- 不要把 `server/.env`、`.env.local` 或任何含真实 Key 的文件提交到版本库(均已在 `.gitignore` 中忽略)

关联文档:[快速开始](getting-started.md) · [数据持久化](data-persistence.md) · [AI 服务对接](ai-integration.md)
