import { env } from '../../../utils/env';
import {
  generateAasaForProject,
  getOptimallyFormattedString,
} from '../../platforms/ios/association/aasa';
import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:aasa') as typeof console.log;

/**
 * Middleware for generating an Apple App Site Association file for the current project.
 *
 * Test by making a get request with:
 * curl -v http://localhost:19000/apple-app-site-association
 */
export class AppleAppSiteAssociationMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, [
      // TODO(EvanBacon): Maybe we should just support the more qualified path? Apple will always ping both paths.
      '/apple-app-site-association',
      '/.well-known/apple-app-site-association',
    ]);
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
      return next();
    }

    if (env.EXPO_NO_APPLE_APP_SITE_ASSOCIATION) {
      debug(
        'Skipping Apple App Site Association middleware because EXPO_NO_APPLE_APP_SITE_ASSOCIATION is set.'
      );
      return next();
    }

    const aasa = generateAasaForProject(this.projectRoot);
    if (!aasa) {
      return next();
    }

    const contents = getOptimallyFormattedString(aasa);

    debug('Generated Apple App Site Association file:\n', contents);
    // Respond with the generated Apple App Site Association file as json
    res.setHeader('Content-Type', 'application/json');
    res.end(contents);
  }
}
