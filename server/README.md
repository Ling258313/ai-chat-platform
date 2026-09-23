
# AI 对话平台 · 服务端（Node.js + Express）

这是 [AI 对话平台](../README.md) 的 BFF（Backend for Frontend）层。

它解决的是一个**真实存在的安全问题**：原来的实现里，浏览器直接拿着 API Key 去请求大模型厂商，
Key 存在 `localStorage`、出现在每一次出站请求里 —— 任何人打开开发者工具都能抄走。

现在密钥只存在于服务端环境变量中，浏览器这一侧再也拿不到它。

---

## 改造前后

**改造前：**

```
浏览器 ──── Bearer sk-xxxx ────►  大模型 API
   ↑
   Key 存在 localStorage，F12 就能看到
```

**改造后：**

```
浏览器 ──── 无密钥 ────►  Node BFF ──── Bearer sk-xxxx ────►  大模型 API
                            ↑
                     Key 只在服务端环境变量里
```

对用户的体验没有任何变化：回复依然是逐字流式出现的。

---

## 快速开始

```bash
cd server
npm install
cp .env.example .env      # 然后填入你的 UPSTREAM_API_KEY
npm run dev               # http://localhost:3000
```

验证是否跑起来：

```bash
curl http://localhost:3000/api/health
# {"ok":true,"uptime":3}
```

配合前端使用：前端项目根目录另开一个终端跑 `npm run dev`，
Vite 会把 `/api` 转发到 `http://localhost:3000`。

---

## 目录结构

```
server/
├── src/
│   ├── index.js                  # 入口：装配中间件 → 挂路由 → 启动 → 处理退出信号
│   ├── config.js                 # 集中读取并校验环境变量（启动即失败，不留到运行时）
│   ├── middleware/
│   │   ├── errorHandler.js       # 统一错误处理（注意：必须 4 个参数）
│   │   └── rateLimit.js          # 滑动窗口限流
│   └── routes/
│       └── chat.js               # POST /api/chat —— SSE 流式透传
├── .env.example
└── package.json
```

---

## 几个值得说明的设计决定

### 1. 用 `--env-file-if-exists` 而不是 dotenv

Node 20.6+ 内置了读取 `.env` 的能力，所以启动脚本直接写：

```json
"dev": "node --watch --env-file-if-exists=.env src/index.js"
```

少一个依赖，也少一层要维护的东西。`--watch` 则替代了 nodemon。

### 2. 密钥校验放在启动时，不放在请求时

`config.js` 里如果读不到 `UPSTREAM_API_KEY` 会直接 `process.exit(1)` 并打印怎么修。

理由是：**配置错误是部署问题，不是业务问题**。启动就崩，比跑起来之后在某个深夜的请求里
才报「401 Unauthorized」要好得多。这叫 fail fast。

### 3. SSE 透传用 `pipeline`，不是手写 read/write 循环

```js
await pipeline(Readable.fromWeb(upstream.body), res);
```

`Readable.fromWeb` 把 `fetch` 返回的 Web Stream 转成 Node Stream，
`pipeline` 负责**背压**：客户端读得慢时自动暂停读取上游，数据不会在内存里越堆越多。
手写 `for await (const chunk of ...) res.write(chunk)` 很容易漏掉这一层，
在长回复 + 慢客户端时会变成内存问题。

### 4. 必须设置 `X-Accel-Buffering: no`

```js
res.writeHead(200, {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
});
res.flushHeaders();
```

Nginx 默认会把响应缓冲到一定大小再发。不关掉它，前端的「逐字输出」会变成
「憋三秒、蹦一大段」。这个头就是给 Nginx 看的开关。

### 5. 客户端断开时，要主动 abort 上游请求

```js
const upstreamAbort = new AbortController();
res.on('close', () => {
  if (!res.writableEnded) upstreamAbort.abort();
});
```

用户点「停止生成」或者直接关掉页面时，如果不把上游也断掉，
大模型会继续生成、**继续计费**，连接也不会释放。

### 6. 优雅关闭

收到 `SIGTERM`（Docker 停止容器时会发）时，先 `server.close()` 停止接收新连接，
等在途请求跑完再退出。直接 `process.exit()` 会把正在流式输出的请求拦腰砍断。

---

## 已知边界

这部分是**主动写出来**的，不是遗漏：

| 边界 | 说明 |
|---|---|
| 限流是单进程内存实现 | 多实例横向扩容时每个进程各算各的，要准确必须换成 Redis 之类的共享存储 |
| 没有用户级鉴权 | 目前只消除了「密钥泄露给终端用户」，任何人能访问到这个服务就能用。真实产品还需要登录态 |
| 上游只支持 OpenAI 兼容协议 | 换其他协议需要在 `routes/chat.js` 里加适配层 |

---

## 接口

### `GET /api/health`

```json
{ "ok": true, "uptime": 128 }
```

### `POST /api/chat`

请求体：

```json
{
  "messages": [{ "role": "user", "content": "你好" }],
  "model": "deepseek-chat",
  "temperature": 0.7
}
```

响应：`text/event-stream`，逐帧推送，格式与 OpenAI 兼容接口一致，以 `data: [DONE]` 结束。

错误响应统一为：

```json
{ "error": { "message": "..." } }
```
