import path from 'path';
import send from 'send';
import { parse } from 'url';

import { parsePlatformHeader } from './resolvePlatform';
import { ServerRequest, ServerResponse } from './server.types';
import { env } from '../../../utils/env';

const debug = require('debug')('expo:start:server:middleware:serveStatic') as typeof console.log;

/**
 * Adds support for serving the files in the static `public/` folder to web apps.
 */
export class ServeStaticMiddleware {
  constructor(private projectRoot: string) {}
  getHandler() {
    const publicPath = path.join(this.projectRoot, env.EXPO_PUBLIC_FOLDER);

    debug(`Serving static files from:`, publicPath);
    const opts = {
      root: publicPath,
    };
    return (req: ServerRequest, res: ServerResponse, next: any) => {
      if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
        return next();
      }

      const platform = parsePlatformHeader(req);
      // Currently this is web-only
      if (platform && platform !== 'web') {
        return next();
      }

      const pathname = parse(req.url).pathname;
      if (!pathname) {
        return next();
      }

      debug(`Maybe serve static:`, pathname);
      const stream = send(req, pathname, opts);

      // add file listener for fallthrough
      let forwardError = false;
      stream.on('file', function onFile() {
        // once file is determined, always forward error
        forwardError = true;
      });

      // forward errors
      stream.on('error', function error(err: any) {
        if (forwardError || !(err.statusCode < 500)) {
          next(err);
          return;
        }

        next();
      });

      // pipe
      stream.pipe(res);
    };
  }
}
