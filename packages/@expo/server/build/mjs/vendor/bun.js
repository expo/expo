import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequestHandler as createExpoHandler } from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';
export { ExpoError } from './abstract';
const STORE = new AsyncLocalStorage();
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(params, setup) {
    const run = createNodeRequestScope(STORE, params);
    const onRequest = createExpoHandler({
        ...createNodeEnv(params),
        ...setup,
    });
    return (request) => run(onRequest, request);
}
//# sourceMappingURL=bun.js.map