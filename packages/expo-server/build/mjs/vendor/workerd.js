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
    const onRequest = createExpoHandler({
        ...createWorkerdEnv(params),
        ...setup,
    });
    return (request, env, ctx) => run(onRequest, request, env, ctx);
}
//# sourceMappingURL=workerd.js.map