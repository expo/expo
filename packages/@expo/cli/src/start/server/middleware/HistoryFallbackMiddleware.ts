import { parsePlatformHeader } from './resolvePlatform';
import { ServerMiddleware } from './server.types';

/**
 * Create a web-only middleware which redirects to the index middleware without losing the path component.
 * This is useful for things like React Navigation which need to render the index.html and then direct the user in-memory.
 */
export class HistoryFallbackMiddleware {
  constructor(private indexMiddleware: ServerMiddleware) {}

  getHandler(): ServerMiddleware {
    return async (req, res, next) => {
      const platform = parsePlatformHeader(req);

      if (!platform || platform === 'web') {
        // Redirect unknown to the manifest handler while preserving the path.
        // This implements the HTML5 history fallback API.
        return await this.indexMiddleware(req, res, next);
      }

      return next();
    };
  }
}
