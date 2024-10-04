"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prependMiddleware = prependMiddleware;
exports.replaceMiddlewareWith = replaceMiddlewareWith;
/**
 * Prepends a `middleware` to current server middleware stack.
 *
 * @param app connect app server instance
 * @param middleware target middleware to be prepended
 */
function prependMiddleware(app, middleware) {
  app.use(middleware);
  app.stack.unshift(app.stack.pop());
}

/**
 * Replaces source middleware with a new middlware in connect app
 *
 * @param app connect app server instance
 * @param sourceMiddleware source middlware to be matched and replaces
 * @param targetMiddleware new middlware
 */
function replaceMiddlewareWith(app, sourceMiddleware, targetMiddleware) {
  const item = app.stack.find(middleware => middleware.handle === sourceMiddleware);
  if (item) {
    item.handle = targetMiddleware;
  }
}
//# sourceMappingURL=middlwareMutations.js.map