
// 服务入口：装配中间件 → 挂载路由 → 启动 → 处理退出信号
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();

// 不返回 X-Powered-By: Express —— 少给扫描器一条线索
app.disable('x-powered-by');

// 部署在 Nginx 后面时，req.ip 默认拿到的是 Nginx 的地址。
// trust proxy 让 Express 去读 X-Forwarded-For，限流才能按真实客户端 IP 计数。
app.set('trust proxy', 1);

// ---------- 中间件（顺序有讲究）----------
app.use(helmet());                                        // 安全响应头
app.use(cors({ origin: config.corsOrigins }));            // 开发期允许前端 5173 跨域
app.use(express.json({ limit: '1mb' }));                  // 解析 JSON 体，并限制大小

// 健康检查：给 Docker healthcheck / 负载均衡用
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

// 业务路由。限流只挂在 /api 下，健康检查不受影响
app.use('/api', rateLimit, chatRouter);

// 兜底 404
app.use((req, res) => {
  res.status(404).json({ error: { message: '接口不存在：' + req.method + ' ' + req.path } });
});

// ★ 错误处理中间件必须放在所有路由之后
app.use(errorHandler);

// ---------- 启动 ----------
const server = app.listen(config.port, () => {
  console.log('[server] 已启动：http://localhost:' + config.port);
  console.log('[server] 上游地址：' + config.upstreamBaseUrl);
  console.log(
    '[server] 密钥来自环境变量 UPSTREAM_API_KEY，长度 ' +
      config.upstreamApiKey.length +
      '，只会用于服务端出站请求'
  );
  console.log('[server] 允许的前端来源：' + config.corsOrigins.join(', '));
});

// ---------- 优雅关闭 ----------
// 容器停止时 Docker 会先发 SIGTERM。直接 process.exit 会把正在流式输出的
// 请求拦腰砍断；正确做法是先停止接收新连接，等在途请求处理完再退出。
function shutdown(signal) {
  console.log('[server] 收到 ' + signal + '，停止接收新请求…');

  server.close(() => {
    console.log('[server] 在途请求已处理完，正常退出');
    process.exit(0);
  });

  // 兜底：容器默认只等 10 秒就会 SIGKILL，所以自己先强退，避免卡在 stopping
  setTimeout(() => {
    console.error('[server] 超时仍未关闭，强制退出');
    process.exit(1);
  }, 8000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
