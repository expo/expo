import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequestHandler as createExpoHandler } from './abstract';
import { createWorkerdEnv, createWorkerdRequestScope, } from './environment/workerd';
export { ExpoError } from './abstract';
const STORE = new AsyncLocalStorage();
/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler(params, setup) {
    const run = createWorkerdRequestScope(STORE, params);
    const common = createWorkerdEnv(params);
    const onRequest = createExpoHandler({ ...common, ...setup });
    function handler(request, env, ctx) {
        return run(onRequest, request, env, ctx);
    }
    handler.preload = common.preload;
    return handler;
}
//# sourceMappingURL=workerd.js.map