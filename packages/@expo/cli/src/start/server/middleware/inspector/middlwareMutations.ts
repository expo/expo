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
  const item = app.stack.find((middleware) => middleware.handle === sourceMiddleware);
  if (item) {
    item.handle = targetMiddleware;
  }
}
