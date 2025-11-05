import { AsyncLocalStorage } from 'node:async_hooks';

import { createRequestScope } from '../runtime';
import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createWorkerdEnv, ExecutionContext } from './environment/workerd';

export { ExpoError } from './abstract';

export type RequestHandler<Env = unknown> = (
  req: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

const STORE = new AsyncLocalStorage();

/**
 * Returns a request handler for EAS Hosting deployments.
 */
export function createRequestHandler<Env = unknown>(
  params: { build?: string },
  setup?: RequestHandlerParams
): RequestHandler<Env> {
  const makeRequestAPISetup = (request: Request, _env: Env, ctx: ExecutionContext) => ({
    origin: request.headers.get('Origin') || 'null',
    environment: request.headers.get('eas-environment') || null,
    waitUntil: ctx.waitUntil?.bind(ctx),
  });
  const run = createRequestScope(STORE, makeRequestAPISetup);
  const onRequest = createExpoHandler({
    ...createWorkerdEnv(params),
    ...setup,
  });
  return (request, env, ctx) => run(onRequest, request, env, ctx);
}
