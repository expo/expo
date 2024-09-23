import type { Server as ConnectServer, HandleFunction } from 'connect';

/**
 * Prepends a `middleware` to current server middleware stack.
 *
 * @param app connect app server instance
 * @param middleware target middleware to be prepended
 */
export function prependMiddleware(app: ConnectServer, middleware: HandleFunction) {
  app.use(middleware);
  app.stack.unshift(app.stack.pop()!);
}

/**
 * Replaces source middleware with a new middlware in connect app
 *
 * @param app connect app server instance
 * @param sourceMiddleware source middlware to be matched and replaces
 * @param targetMiddleware new middlware
 */
export function replaceMiddlewareWith(
  app: ConnectServer,
  sourceMiddleware: HandleFunction,
  targetMiddleware: HandleFunction
) {
  const item = app.stack.find((middleware) => {
    const handlerCode = middleware.handle.toString();
    return !handlerCode.includes('[native code]') && handlerCode === sourceMiddleware.toString();
  });
  if (item) {
    item.handle = targetMiddleware;
  }
}

/**
 * Removes a middleware from the connect app stack.
 *
 * @param app connect app server instance
 * @param middleware middlware to remove
 * @returns `true` if middleware was removed, `false` otherwise
 */
export function removeMiddleware(app: ConnectServer, middleware: HandleFunction) {
  const index = app.stack.findIndex((item) => {
    const handlerCode = item.handle.toString();
    return !handlerCode.includes('[native code]') && handlerCode === middleware.toString();
  });

  if (index !== -1) {
    app.stack.splice(index, 1);
    return true;
  }

  return false;
}
