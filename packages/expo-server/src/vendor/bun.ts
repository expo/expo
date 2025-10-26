import { AsyncLocalStorage } from 'node:async_hooks';

import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';

export { ExpoError } from './abstract';

export type RequestHandler = (req: Request) => Promise<Response>;

const STORE = new AsyncLocalStorage();

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  params: { build: string; environment?: string | null },
  setup?: RequestHandlerParams
): RequestHandler {
  const run = createNodeRequestScope(STORE, params);
  const onRequest = createExpoHandler({
    ...createNodeEnv(params),
    ...setup,
  });
  return (request) => run(onRequest, request);
}
