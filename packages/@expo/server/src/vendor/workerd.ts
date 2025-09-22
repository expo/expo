import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createWorkerdEnv } from './environment/workerd';

export type RequestHandler = (req: Request) => Promise<Response>;

/**
 * Returns a request handler for Workerd deployments.
 */
export function createRequestHandler(
  params: { build: string },
  setup?: RequestHandlerParams
): RequestHandler {
  return createExpoHandler({
    ...createWorkerdEnv(params),
    ...setup,
  });
}
