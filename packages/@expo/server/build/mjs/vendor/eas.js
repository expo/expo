import { createRequestScope } from '../runtime';
import { createRequestHandler as createExpoHandler } from './abstract';
import { createWorkerdEnv } from './environment/workerd';
export { ExpoError } from './abstract';
/**
 * Returns a request handler for EAS Hosting deployments.
 */
export function createRequestHandler(params, setup) {
    const makeRequestAPISetup = (request, _env, ctx) => ({
        origin: request.headers.get('Origin') || 'null',
        environment: request.headers.get('eas-environment') || null,
        waitUntil: ctx.waitUntil?.bind(ctx),
    });
    const run = createRequestScope(makeRequestAPISetup);
    const onRequest = createExpoHandler({
        ...createWorkerdEnv(params),
        ...setup,
    });
    return (request, env, ctx) => run(onRequest, request, env, ctx);
}
//# sourceMappingURL=eas.js.map