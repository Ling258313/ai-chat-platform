
// 统一错误处理中间件。
export function errorHandler(err, req, res, next) {
  // 如果响应头已经发出去了（比如 SSE 已经开始推流），
  // 这时不能再 res.status().json()，否则会抛 ERR_HTTP_HEADERS_SENT。
  // 唯一能做的是把连接断掉，让前端走它自己的错误分支。
  if (res.headersSent) {
    console.error('[error] 响应已开始发送，直接断开连接：', err.message);
    res.end();
    return;
  }

  const status = err.status ?? 500;
  console.error('[error]', status, err.message);

  res.status(status).json({
    error: { message: status === 500 ? '服务器内部错误' : err.message },
  });
}
