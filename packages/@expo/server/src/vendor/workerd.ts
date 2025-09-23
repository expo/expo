import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createRequestScope } from '../runtime/scope';
import { createWorkerdEnv } from './environment/workerd';

export { ExpoError } from './abstract';

interface ExecutionContext {
  waitUntil?(promise: Promise<any>): void;
  props?: any;
}

export type RequestHandler<Env = unknown> = (
  req: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler<Env = unknown>(
  params: { build: string; environment?: string | null },
  setup?: Partial<RequestHandlerParams>
): RequestHandler<Env> {
  const makeRequestAPISetup = (request: Request, _env: Env, ctx: ExecutionContext) => ({
    origin: request.headers.get('Origin') || 'null',
    environment:
      params.environment ??
      (typeof ctx.props?.environment === 'string' ? ctx.props.environment : null),
    waitUntil: ctx.waitUntil?.bind(ctx),
  });
  const run = createRequestScope(makeRequestAPISetup);
  const onRequest = createExpoHandler({
    ...createWorkerdEnv(params),
    ...setup,
  });
  return (request, env, ctx) => run(onRequest, request, env, ctx);
}
