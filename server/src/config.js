
// 集中读取并校验环境变量。
//
// 为什么要在启动时校验而不是等到第一次请求？
// 因为"配置错了"是部署问题，不是业务问题。启动就崩，比跑起来之后
// 在某个深夜的请求里才报错要好得多——这叫 fail fast。

/** 读取必填环境变量，缺失就直接退出并给出可操作的提示 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error('[config] 缺少必填环境变量 ' + name);
    console.error('[config] 请复制 .env.example 为 .env，填好后重新启动');
    process.exit(1);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),

  // 上游 OpenAI 兼容接口。去掉结尾的斜杠，避免拼出 //chat/completions
  upstreamBaseUrl: (process.env.UPSTREAM_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/+$/, ''),

  // ★ 整个服务的核心：密钥只在服务端存在，永远不会下发到浏览器
  upstreamApiKey: required('UPSTREAM_API_KEY'),

  defaultModel: process.env.DEFAULT_MODEL ?? 'deepseek-chat',

  // 允许跨域的前端来源，逗号分隔。生产环境应该只填自己的域名
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
