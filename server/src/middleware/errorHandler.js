
// 统一错误处理中间件。
//
// ★ 面试常问：为什么错误中间件必须写 4 个参数？
//   Express 是靠函数的 length（形参个数）来判断"这是不是错误中间件"的，
//   写成 3 个参数就会被当成普通中间件，永远不会被调用。
//   所以第 4 个参数 next 哪怕用不到也不能删。
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
