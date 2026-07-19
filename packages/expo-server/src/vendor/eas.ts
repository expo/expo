import { AsyncLocalStorage } from 'node:async_hooks';

import { createRequestScope } from '../runtime';
import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createWorkerdEnv, ExecutionContext } from './environment/workerd';

export { ExpoError } from './abstract';

export interface RequestHandler<Env = unknown> {
  (req: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
  preload(): Promise<void>;
}

const STORE = new AsyncLocalStorage();

/**
 * Returns a request handler for EAS Hosting deployments.
 */
export function createRequestHandler<Env = unknown>(
  params: { build?: string },
  setup?: RequestHandlerParams
): RequestHandler<Env> {
  const makeRequestAPISetup = (request: Request, _env: Env, ctx: ExecutionContext) => ({
    origin: request.headers.get('Origin') || null,
    environment: request.headers.get('eas-environment') || null,
    waitUntil: ctx.waitUntil?.bind(ctx),
  });
  const run = createRequestScope(STORE, makeRequestAPISetup);
  const common = createWorkerdEnv(params);
  const onRequest = createExpoHandler({ ...common, ...setup });

  function handler(request: Request, env: Env, ctx: ExecutionContext) {
    return run(onRequest, request, env, ctx);
  }

  handler.preload = common.preload;
  return handler;
}
