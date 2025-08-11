import { createRequestHandler as createExpoHandler } from '../index';
import {
  getApiRoute,
  getHtml,
  getRoutesManifest,
  handleRouteError,
  getMiddleware,
} from '../runtime/workerd';

export type RequestHandler = (req: Request) => Promise<Response>;

/**
 * Returns a request handler for Workerd deployments.
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
