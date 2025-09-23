import { createRequestHandler as createExpoHandler } from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';
export { ExpoError } from './abstract';
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(params, setup) {
    const run = createNodeRequestScope(params);
    const onRequest = createExpoHandler({
        ...createNodeEnv(params),
        ...setup,
    });
    return (request) => run(onRequest, request);
}
//# sourceMappingURL=bun.js.map