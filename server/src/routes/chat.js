
// 核心路由：POST /api/chat
//
// 它做的事只有一件——把浏览器的请求转给大模型，再把大模型的流式响应原样透传回去。
// 区别在于：密钥在上游那一侧，浏览器这一侧永远看不到。

import { Router } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '../config.js';

export const chatRouter = Router();

/** 把上游返回的错误体尽量变成一句人话 */
async function readUpstreamError(upstream) {
  try {
    const text = await upstream.text();
    const parsed = JSON.parse(text);
    return parsed?.error?.message ?? text.slice(0, 500);
  } catch {
    return '上游没有返回可解析的错误信息';
  }
}

chatRouter.post('/chat', async (req, res) => {
  const { messages, model, temperature } = req.body ?? {};

  // 参数校验放在最前面：脏请求不要浪费一次上游调用
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: { message: 'messages 不能为空' } });
    return;
  }

  // ★ 客户端断开时，必须把上游请求一起 abort。
  //   前端点「停止生成」、或者用户直接关掉页面，都会触发 res 的 close 事件。
  //   不做这件事的后果：上游继续生成、继续计费，连接也不会释放。
  const upstreamAbort = new AbortController();
  res.on('close', () => {
    // writableEnded 为 true 说明是正常结束，不是提前断开，别误伤
    if (!res.writableEnded) {
      console.log('[chat] 客户端提前断开，已中止上游请求');
      upstreamAbort.abort();
    }
  });

  let upstream;
  try {
    upstream = await fetch(config.upstreamBaseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ★ 密钥在整个系统里只出现在这一行
        Authorization: 'Bearer ' + config.upstreamApiKey,
      },
      body: JSON.stringify({
        model: model || config.defaultModel,
        messages,
        stream: true,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
      }),
      signal: upstreamAbort.signal,
    });
  } catch (err) {
    // 客户端主动断开是预期行为，不算错误
    if (err.name === 'AbortError') return;

    const wrapped = new Error('连接上游失败：' + err.message);
    wrapped.status = 502; // Bad Gateway：我作为网关，联系不上上游
    throw wrapped;
  }

  // 上游返回非 2xx，或者没有响应体：不能吞掉，要把原因翻译给前端
  if (!upstream.ok || !upstream.body) {
    const detail = await readUpstreamError(upstream);
    const status = upstream.status === 200 ? 502 : upstream.status;
    console.error('[chat] 上游异常', status, detail);
    res.status(status).json({ error: { message: '上游返回 ' + status + '：' + detail } });
    return;
  }

  // ---------- 开始 SSE 透传 ----------
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    // no-transform 很关键：它告诉中间层「不要压缩、不要缓冲」
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // ★ X-Accel-Buffering 是给 Nginx 看的。默认 Nginx 会把响应攒够一块再发，
    //   那样前端就不是逐字出现，而是一次蹦出一大段。设成 no 才能边收边发。
    'X-Accel-Buffering': 'no',
  });
  // 立刻把响应头发出去，前端才知道「流已经建立了」，可以开始等待
  res.flushHeaders();

  try {
    // ★ pipeline 是这里的灵魂：
    //   Readable.fromWeb 把 fetch 的 Web Stream 转成 Node Stream；
    //   pipeline 自动处理「背压」——客户端读得慢时，暂停读取上游，
    //   数据不会在内存里越堆越多。手写 read/write 循环很容易漏掉这一层。
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (err) {
    // 客户端中途断开时 pipeline 会抛 ERR_STREAM_PREMATURE_CLOSE，这是预期内的
    const expected = err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.name === 'AbortError';
    if (!expected) console.error('[chat] 透传中断：', err.message);
  }
});
