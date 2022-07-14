import { existsSync } from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';
import send from 'send';
import { parse } from 'url';

import { parsePlatformHeader } from './resolvePlatform';
import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:assetRedirect') as typeof console.log;

/**
 * Adds support for serving or redirecting the files in the static public folder to web apps.
 */
export class AssetRedirectMiddleware {
  static getStandardRedirects = (projectRoot: string) => {
    return {
      // Support automatically hosting the canvas kit skia wasm file for `@shopify/react-native-skia`.
      '/static/js/canvaskit.wasm': () => {
        return resolveFrom.silent(projectRoot, 'canvaskit-wasm/bin/full/canvaskit.wasm');
      },
    };
  };

  constructor(
    private projectRoot: string,
    /** Public folder path relative to the project root. This is `web` for legacy Webpack, and `public` for universal bundling. */
    private publicFolder: string,
    private redirectMap: Record<
      string,
      () => string | undefined
    > = AssetRedirectMiddleware.getStandardRedirects(projectRoot)
  ) {}

  getHandler() {
    const publicPath = path.join(this.projectRoot, this.publicFolder);

    debug(`redirecting assets that do not exist in public folder:`, publicPath);

    const allowed = Object.keys(this.redirectMap);

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

      if (!allowed.includes(pathname)) {
        return next();
      }

      // If the file exists then host it normally.
      if (!existsSync(path.join(publicPath, pathname))) {
        debug('asset redirect -> serving from public folder using fallback middleware');
        return next();
      }
      // Otherwise check for a redirect.
      const redirect = this.redirectMap[pathname]();
      debug('asset redirect -> to:', redirect);
      if (!redirect) {
        return next();
      }

      const stream = send(req, redirect);

      // add file listener for fallthrough
      let forwardError = false;
      stream.on('file', function onFile() {
        // once file is determined, always forward error
        forwardError = true;
        debug('asset redirect -> success');
      });

      // forward errors
      stream.on('error', function error(err: any) {
        debug('asset redirect -> error: %O', err);
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
