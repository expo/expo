import { AsyncLocalStorage } from 'node:async_hooks';

import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import {
  createWorkerdEnv,
  createWorkerdRequestScope,
  ExecutionContext,
} from './environment/workerd';

export { ExpoError } from './abstract';

export type RequestHandler<Env = unknown> = (
  req: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

const STORE = new AsyncLocalStorage();

/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler<Env = unknown>(
  params: { build: string; environment?: string | null },
  setup?: RequestHandlerParams
): RequestHandler<Env> {
  const run = createWorkerdRequestScope(STORE, params);
  const onRequest = createExpoHandler({
    ...createWorkerdEnv(params),
    ...setup,
  });
  return (request, env, ctx) => run(onRequest, request, env, ctx);
}
