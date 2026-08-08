import { getFaviconFromExpoConfigAsync } from '../../../export/favicon';
import { ExpoMiddleware } from './ExpoMiddleware';
import { event } from './events';
import type { ServerNext, ServerRequest, ServerResponse } from './server.types';

/**
 * Middleware for generating a favicon for the current project if one doesn't already exist.
 * Handles both `/favicon.ico` (the historic default) and `/favicon.svg`, picking the response
 * format based on the configured source in `web.favicon`:
 *
 *  - `web.favicon: './path/to/icon.png'` (or other raster) → serves `/favicon.ico` rasterized.
 *  - `web.favicon: './path/to/icon.svg'`                    → serves `/favicon.svg` raw.
 *
 * Requests for a format that doesn't match the configured source fall through to the static
 * middleware, so a user with `web.favicon` set to a PNG can still ship a hand-crafted
 * `favicon.svg` in their public folder (and vice versa).
 *
 * Test with:
 *   curl -v http://localhost:8081/favicon.ico
 *   curl -v http://localhost:8081/favicon.svg
 */
export class FaviconMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/favicon.ico', '/favicon.svg']);
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      return next();
    }

    const requestedKind: 'svg' | 'ico' = req.url?.endsWith('.svg') ? 'svg' : 'ico';

    try {
      const data = await getFaviconFromExpoConfigAsync(this.projectRoot, { force: true });
      if (!data) {
        return next();
      }
      const configuredKind: 'svg' | 'ico' = data.path.endsWith('.svg') ? 'svg' : 'ico';
      if (configuredKind !== requestedKind) {
        return next();
      }
      res.setHeader(
        'Content-Type',
        configuredKind === 'svg' ? 'image/svg+xml' : 'image/x-icon'
      );
      res.end(data.source);
    } catch (error: any) {
      // Pass through on ENOENT errors
      event('favicon:generate_failed', { error: event.error(error as Error) });
      if (error.code === 'ENOENT') {
        return next();
      }
      return next(error);
    }
  }
}
