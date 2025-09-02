import { createRequestHandler as createExpoHandler } from '../index';
import { getApiRoute, getHtml, getRoutesManifest, handleRouteError, getMiddleware, } from '../runtime/workerd';
/**
 * Returns a request handler for Workerd deployments.
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
//# sourceMappingURL=workerd.js.map