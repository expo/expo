import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';
import { getFaviconFromExpoConfigAsync } from '../../../export/favicon';

const debug = require('debug')('expo:start:server:middleware:favicon') as typeof console.log;

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
        debug('No favicon defined in the Expo Config, skipping generation.');
        return next();
      }
      faviconImageData = data.source;
      debug('✅ Generated favicon successfully.');
    } catch (error: any) {
      debug('Failed to generate favicon from Expo config:', error);
      return next(error);
    }
    // Respond with the generated favicon file
    res.setHeader('Content-Type', 'image/x-icon');
    res.end(faviconImageData);
  }
}
