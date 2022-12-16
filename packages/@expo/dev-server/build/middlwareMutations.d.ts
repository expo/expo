import type { Server as ConnectServer, HandleFunction } from 'connect';
/**
 * Prepends a `middleware` to current server middleware stack.
 *
 * @param app connect app server instance
 * @param middleware target middleware to be prepended
 */
export declare function prependMiddleware(app: ConnectServer, middleware: HandleFunction): void;
/**
 * Replaces source middleware with a new middlware in connect app
 *
 * @param app connect app server instance
 * @param sourceMiddleware source middlware to be matched and replaces
 * @param targetMiddleware new middlware
 */
export declare function replaceMiddlewareWith(app: ConnectServer, sourceMiddleware: HandleFunction, targetMiddleware: HandleFunction): void;
