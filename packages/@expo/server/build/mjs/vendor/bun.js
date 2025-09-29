import { createRequestHandler as createExpoHandler } from './abstract';
import { createNodeEnv } from './environment/node';
export { ExpoError } from './abstract';
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(params, setup) {
    return createExpoHandler({
        ...createNodeEnv(params),
        ...setup,
    });
}
//# sourceMappingURL=bun.js.map