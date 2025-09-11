import { createRequestHandler as createExpoHandler } from '../index';
import { getApiRoute, getHtml, getMiddleware, getRoutesManifest, handleRouteError, } from '../runtime/node';
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler({ build }, setup = {}) {
    return createExpoHandler({
        getRoutesManifest: getRoutesManifest(build),
        getHtml: getHtml(build),
        getApiRoute: getApiRoute(build),
        getMiddleware: getMiddleware(build),
        handleRouteError: handleRouteError(),
        ...setup,
    });
}
//# sourceMappingURL=bun.js.map