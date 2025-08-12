import { createRequestHandler as createExpoHandler } from '../index';
import {
  getApiRoute,
  getHtml,
  getMiddleware,
  getRoutesManifest,
  handleRouteError,
} from '../runtime/node';

export type RequestHandler = (req: Request) => Promise<Response>;

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  { build }: { build: string },
  setup: Partial<Parameters<typeof createExpoHandler>[0]> = {}
): RequestHandler {
  return createExpoHandler({
    getRoutesManifest: getRoutesManifest(build),
    getHtml: getHtml(build),
    getApiRoute: getApiRoute(build),
    getMiddleware: getMiddleware(build),
    handleRouteError: handleRouteError(),
    ...setup,
  });
}
