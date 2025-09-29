import { createRequestHandler as createExpoHandler } from './abstract';
import { createWorkerdEnv } from './environment/workerd';
export { ExpoError } from './abstract';
/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler(params, setup) {
    return createExpoHandler({
        ...createWorkerdEnv(params),
        ...setup,
    });
}
//# sourceMappingURL=workerd.js.map