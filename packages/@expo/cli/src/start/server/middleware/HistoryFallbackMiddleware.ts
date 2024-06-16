import { parsePlatformHeader } from './resolvePlatform';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';

/**
 * Create a web-only middleware which redirects to the index middleware without losing the path component.
 * This is useful for things like React Navigation which need to render the index.html and then direct the user in-memory.
 */
export class HistoryFallbackMiddleware {
  constructor(
    private indexMiddleware: (
      req: ServerRequest,
      res: ServerResponse,
      next: ServerNext
    ) => Promise<void>
  ) {}
  getHandler() {
    return (req: ServerRequest, res: ServerResponse, next: any) => {
      const platform = parsePlatformHeader(req);

      if (!platform || platform === 'web') {
        // Redirect unknown to the manifest handler while preserving the path.
        // This implements the HTML5 history fallback API.
        return this.indexMiddleware(req, res, next);
      }

      return next();
    };
  }
}
