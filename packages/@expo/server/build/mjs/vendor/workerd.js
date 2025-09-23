import { createRequestHandler as createExpoHandler } from './abstract';
import { createWorkerdEnv, createWorkerdRequestScope, } from './environment/workerd';
export { ExpoError } from './abstract';
/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler(params, setup) {
    const run = createWorkerdRequestScope(params);
    const onRequest = createExpoHandler({
        ...createWorkerdEnv(params),
        ...setup,
    });
    return (request, env, ctx) => run(onRequest, request, env, ctx);
}
//# sourceMappingURL=workerd.js.map