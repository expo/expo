import { createRequestHandler as createExpoHandler, type RequestHandlerParams } from './abstract';
import { createNodeEnv } from './environment/node';

export { ExpoError } from './abstract';

export type RequestHandler = (req: Request) => Promise<Response>;

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  params: { build: string },
  setup?: Partial<RequestHandlerParams>
): RequestHandler {
  return createExpoHandler({
    ...createNodeEnv(params),
    ...setup,
  });
}
