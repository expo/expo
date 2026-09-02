import { getFaviconFromExpoConfigAsync } from '../../../export/favicon';
import { ExpoMiddleware } from './ExpoMiddleware';
import { event } from './events';
import type { ServerNext, ServerRequest, ServerResponse } from './server.types';

/**
 * Middleware for generating a favicon.ico file for the current project if one doesn't exist.
 *
 * Test by making a get request with:
 * curl -v http://localhost:8081/favicon.ico
 */
export class FaviconMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/favicon.ico']);
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      return next();
    }

    let faviconImageData: Buffer | null;
    try {
      const data = await getFaviconFromExpoConfigAsync(this.projectRoot, { force: true });
      if (!data) {
        return next();
      }
      faviconImageData = data.source;
    } catch (error: any) {
      // Pass through on ENOENT errors
      event('favicon:generate_failed', { error: event.error(error as Error) });
      if (error.code === 'ENOENT') {
        return next();
      }
      return next(error);
    }
    // Respond with the generated favicon file
    res.setHeader('Content-Type', 'image/x-icon');
    res.end(faviconImageData);
  }
}
