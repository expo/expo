import { createRequestHandler as createExpoHandler } from '../index';

export type RequestHandler = (req: Request) => Promise<Response>;

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  { build }: { build: string },
  setup?: Parameters<typeof createExpoHandler>[1]
): RequestHandler {
  return createExpoHandler(build, setup);
}
