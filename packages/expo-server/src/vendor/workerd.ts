import { AsyncLocalStorage } from 'node:async_hooks';

import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import {
  createWorkerdEnv,
  createWorkerdRequestScope,
  ExecutionContext,
} from './environment/workerd';

export { ExpoError } from './abstract';

export interface RequestHandler<Env = unknown> {
  (req: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
  preload(): Promise<void>;
}

const STORE = new AsyncLocalStorage();

/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler<Env = unknown>(
  params: { build: string; environment?: string | null },
  setup?: RequestHandlerParams
): RequestHandler<Env> {
  const run = createWorkerdRequestScope(STORE, params);
  const common = createWorkerdEnv(params);
  const onRequest = createExpoHandler({ ...common, ...setup });

  function handler(request: Request, env: Env, ctx: ExecutionContext) {
    return run(onRequest, request, env, ctx);
  }

  handler.preload = common.preload;
  return handler;
}
