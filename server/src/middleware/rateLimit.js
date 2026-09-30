
// 极简滑动窗口限流。
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

/** ip -> 该 ip 最近若干次请求的时间戳 */
const hits = new Map();

// 定期清理过期记录，否则 Map 会随着访问过的 ip 无限增长（内存泄漏）
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const alive = timestamps.filter((t) => now - t < WINDOW_MS);
    if (alive.length === 0) hits.delete(ip);
    else hits.set(ip, alive);
  }
}, WINDOW_MS);
// unref()：这个定时器不该阻止进程退出，否则优雅关闭时会被它拖住
sweeper.unref();

export function rateLimit(req, res, next) {
  // req.ip 在没配 trust proxy 时就是直连地址，配了之后是 X-Forwarded-For 里的真实客户端
  const ip = req.ip;
  const now = Date.now();

  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: {
        message:
          '请求过于频繁，每分钟最多 ' +
          MAX_REQUESTS_PER_WINDOW +
          ' 次，请 ' +
          retryAfterSec +
          ' 秒后重试',
      },
    });
    return;
  }

  recent.push(now);
  hits.set(ip, recent);
  next();
}
